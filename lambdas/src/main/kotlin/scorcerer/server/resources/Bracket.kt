package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.path
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.Bracket
import org.openapitools.server.models.BracketLeaderboardRow
import org.openapitools.server.models.BracketMatch
import org.openapitools.server.models.GetBracketLeaderboard200Response
import org.openapitools.server.models.Match
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.LeagueMembershipTable
import scorcerer.server.db.tables.LeagueTable
import scorcerer.server.db.tables.MatchResult
import scorcerer.server.db.tables.MatchRound
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.db.tables.TeamTable
import scorcerer.server.extractUserId
import scorcerer.server.toJson
import scorcerer.utils.BracketScoring
import scorcerer.utils.toTitleCase
import scorcerer.utils.toToGoThrough
import java.time.OffsetDateTime

fun bracketRoutes(contexts: RequestContexts) = routes(
    "/bracket" bind Method.GET to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val rows = loadUserRun(requesterUserId)
        val run = BracketScoring.scoreRun(rows.map { BracketScoring.RunMatch(it.round, it.pick, it.actual) })
        val matches = rows.mapIndexed { index, row ->
            val score = run.perMatch[index]
            BracketMatch(
                matchId = row.matchId,
                round = BracketMatch.Round.valueOf(row.round.value),
                homeTeam = row.homeTeam,
                homeTeamFlagCode = row.homeFlag,
                awayTeam = row.awayTeam,
                awayTeamFlagCode = row.awayFlag,
                kickoff = row.kickoff,
                state = BracketMatch.State.valueOf(row.state.value),
                basePoints = score.basePoints,
                userPick = row.pick.toToGoThrough(),
                actualGoThrough = row.actual.toToGoThrough(),
                correct = score.correct,
            )
        }
        Response(Status.OK).body(Bracket(matches, run.totalPoints).toJson())
    },
    "/league/{leagueId}/bracket-leaderboard" bind Method.GET to { req ->
        val leagueId = req.path("leagueId")!!
        val (leagueName, rows) = if (leagueId == "global") {
            "Global" to buildBracketLeaderboard(null)
        } else {
            val name = transaction {
                LeagueTable.select(LeagueTable.name).where { LeagueTable.id eq leagueId }.singleOrNull()?.get(LeagueTable.name)
            } ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("League does not exist"))
            name to buildBracketLeaderboard(leagueId)
        }
        Response(Status.OK).body(GetBracketLeaderboard200Response(leagueName, rows).toJson())
    },
)

private data class RunRow(
    val matchId: String,
    val round: MatchRound,
    val homeTeam: String,
    val homeFlag: String,
    val awayTeam: String,
    val awayFlag: String,
    val kickoff: OffsetDateTime,
    val state: Match.State,
    val pick: MatchResult?,
    val actual: MatchResult?,
)

private data class ScoredMember(
    val userId: String,
    val firstName: String,
    val familyName: String,
    val totalPoints: Int,
)

private fun loadUserRun(userId: String): List<RunRow> = transaction {
    val awayTeamTable = TeamTable.alias("awayTeam")
    val homeTeamTable = TeamTable.alias("homeTeam")
    val predictions = PredictionTable.selectAll().where { PredictionTable.memberId eq userId }.alias("predictions")
    MatchTable
        .join(awayTeamTable, JoinType.INNER, MatchTable.awayTeamId, awayTeamTable[TeamTable.id])
        .join(homeTeamTable, JoinType.INNER, MatchTable.homeTeamId, homeTeamTable[TeamTable.id])
        .join(predictions, JoinType.LEFT, MatchTable.id, predictions[PredictionTable.matchId])
        .selectAll()
        .where { MatchTable.round inList BracketScoring.KNOCKOUT_ROUNDS }
        .orderBy(MatchTable.datetime to SortOrder.ASC, MatchTable.id to SortOrder.ASC)
        .map { row ->
            val completed = row[MatchTable.state] == Match.State.COMPLETED
            RunRow(
                matchId = row[MatchTable.id].toString(),
                round = row[MatchTable.round],
                homeTeam = row[homeTeamTable[TeamTable.name]].toTitleCase(),
                homeFlag = row[homeTeamTable[TeamTable.flagCode]],
                awayTeam = row[awayTeamTable[TeamTable.name]].toTitleCase(),
                awayFlag = row[awayTeamTable[TeamTable.flagCode]],
                kickoff = row[MatchTable.datetime],
                state = row[MatchTable.state],
                pick = row.getOrNull(predictions[PredictionTable.id])?.let { row[predictions[PredictionTable.result]] },
                actual = if (completed) row[MatchTable.result] else null,
            )
        }
}

private fun buildBracketLeaderboard(leagueId: String?): List<BracketLeaderboardRow> = transaction {
    val members = if (leagueId == null) {
        MemberTable.select(MemberTable.id, MemberTable.firstName, MemberTable.familyName)
            .map { Triple(it[MemberTable.id], it[MemberTable.firstName], it[MemberTable.familyName]) }
    } else {
        (LeagueMembershipTable innerJoin MemberTable)
            .select(MemberTable.id, MemberTable.firstName, MemberTable.familyName)
            .where { LeagueMembershipTable.leagueId eq leagueId }
            .map { Triple(it[MemberTable.id], it[MemberTable.firstName], it[MemberTable.familyName]) }
    }
    if (members.isEmpty()) return@transaction emptyList()

    val knockoutMatches = MatchTable
        .select(MatchTable.id, MatchTable.round, MatchTable.state, MatchTable.result, MatchTable.datetime)
        .where { MatchTable.round inList BracketScoring.KNOCKOUT_ROUNDS }
        .orderBy(MatchTable.datetime to SortOrder.ASC, MatchTable.id to SortOrder.ASC)
        .map { row ->
            val completed = row[MatchTable.state] == Match.State.COMPLETED
            Triple(row[MatchTable.id], row[MatchTable.round], if (completed) row[MatchTable.result] else null)
        }

    val picks = HashMap<Pair<String, Int>, MatchResult?>()
    PredictionTable
        .select(PredictionTable.memberId, PredictionTable.matchId, PredictionTable.result)
        .where { PredictionTable.memberId inList members.map { it.first } }
        .forEach { picks[it[PredictionTable.memberId] to it[PredictionTable.matchId]] = it[PredictionTable.result] }

    val scored = members.map { (id, firstName, familyName) ->
        val run = knockoutMatches.map { (matchId, round, actual) ->
            BracketScoring.RunMatch(round, picks[id to matchId], actual)
        }
        val result = BracketScoring.scoreRun(run)
        ScoredMember(id, firstName, familyName, result.totalPoints)
    }.sortedWith(
        compareByDescending<ScoredMember> { it.totalPoints }
            .thenBy { it.familyName }
            .thenBy { it.firstName }
            .thenBy { it.userId },
    )

    val topTotal = scored.first().totalPoints
    var previousPoints = -1
    var previousPosition = 0
    scored.mapIndexed { index, member ->
        val position = if (member.totalPoints == previousPoints) previousPosition else (index + 1).also { previousPosition = it }
        previousPoints = member.totalPoints
        BracketLeaderboardRow(
            position = position,
            userId = member.userId,
            firstName = member.firstName,
            familyName = member.familyName,
            totalPoints = member.totalPoints,
            isCupHolder = topTotal > 0 && member.totalPoints == topTotal,
        )
    }
}
