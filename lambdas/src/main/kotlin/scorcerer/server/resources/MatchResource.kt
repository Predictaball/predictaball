package scorcerer.server.resources

import org.http4k.core.Method
import org.http4k.core.RequestContexts
import org.http4k.core.Response
import org.http4k.core.Status
import org.http4k.routing.bind
import org.http4k.routing.path
import org.http4k.routing.routes
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.alias
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.openapitools.server.models.*
import org.openapitools.server.models.Prediction
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.*
import scorcerer.server.extractUserId
import scorcerer.server.fromJson
import scorcerer.server.log
import scorcerer.server.requireAdmin
import scorcerer.server.services.endMatch
import scorcerer.server.services.getMatchDay
import scorcerer.server.services.setScore
import scorcerer.server.toJson
import scorcerer.utils.LeaderboardService
import scorcerer.utils.toTitleCase

fun matchRoutes(contexts: RequestContexts, leaderboardService: LeaderboardService) = routes(
    "/match/{matchId}/predictions" bind Method.GET to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val matchId = req.path("matchId")!!
        val leagueId = req.query("leagueId")
        val matchState = transaction {
            MatchTable.select(MatchTable.state).where { MatchTable.id eq matchId.toInt() }.firstOrNull()
                ?.let { it[MatchTable.state] }
                ?: throw ApiResponseError(Response(Status.NOT_FOUND).body("Match does not exist"))
        }
        if (matchState == Match.State.UPCOMING) throw ApiResponseError(Response(Status.BAD_REQUEST).body("Match does not exist"))
        val result = transaction {
            val predictions = PredictionTable innerJoin MemberTable
            if (leagueId.isNullOrBlank()) {
                predictions.selectAll().where { PredictionTable.matchId eq matchId.toInt() }
            } else {
                (predictions innerJoin LeagueMembershipTable).selectAll().where { (PredictionTable.matchId eq matchId.toInt()).and(LeagueMembershipTable.leagueId eq leagueId) }
            }.map { row ->
                PredictionWithUser(
                    Prediction(row[PredictionTable.homeScore], row[PredictionTable.awayScore], row[PredictionTable.matchId].toString(), row[PredictionTable.id].toString(), row[PredictionTable.memberId], row[PredictionTable.points]),
                    User(row[MemberTable.firstName], row[MemberTable.familyName], row[MemberTable.id], row[MemberTable.fixedPoints], 0),
                )
            }
        }
        Response(Status.OK).body(result.toJson())
    },
    "/match/list" bind Method.GET to { req ->
        val requesterUserId = contexts.extractUserId(req)
        val filterType = req.query("filterType")
        val userId = req.query("userId")
        val matches = listMatches(requesterUserId, filterType, userId)
        Response(Status.OK).body(matches.toJson())
    },
    "/match/{matchId}/score" bind Method.POST to { req ->
        requireAdmin(contexts, req) ?: run {
            val matchId = req.path("matchId")!!
            val body: SetMatchScoreRequest = req.bodyString().fromJson()
            val matchDay = getMatchDay(matchId) ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Match does not exist"))
            setScore(matchId, matchDay, body.homeScore, body.awayScore, leaderboardService)
            Response(Status.OK)
        }
    },
    "/match" bind Method.POST to { req ->
        requireAdmin(contexts, req) ?: run {
            val body: CreateMatchRequest = req.bodyString().fromJson()
            val id = transaction {
                MatchTable.insert {
                    it[homeTeamId] = body.homeTeamId.toInt()
                    it[awayTeamId] = body.awayTeamId.toInt()
                    it[datetime] = body.datetime
                    it[state] = Match.State.UPCOMING
                    it[venue] = body.venue
                    it[matchDay] = body.matchDay
                    it[round] = MatchRound.valueOf(body.matchRound.value)
                } get MatchTable.id
            }
            Response(Status.OK).body(CreateMatch200Response(id.toString()).toJson())
        }
    },
    "/match/data/{matchId}" bind Method.GET to { req ->
        val matchId = req.path("matchId")!!
        val match = transaction {
            val awayTeamTable = TeamTable.alias("awayTeam")
            val homeTeamTable = TeamTable.alias("homeTeam")
            MatchTable.join(awayTeamTable, JoinType.INNER, MatchTable.awayTeamId, awayTeamTable[TeamTable.id])
                .join(homeTeamTable, JoinType.INNER, MatchTable.homeTeamId, homeTeamTable[TeamTable.id]).selectAll()
                .orderBy(MatchTable.datetime)
                .where { MatchTable.id eq matchId.toInt() }.singleOrNull()?.let { row ->
                    Match(row[homeTeamTable[TeamTable.name]].toTitleCase(), row[homeTeamTable[TeamTable.flagCode]], row[awayTeamTable[TeamTable.name]].toTitleCase(), row[awayTeamTable[TeamTable.flagCode]], row[MatchTable.id].toString(), row[MatchTable.venue], row[MatchTable.datetime], row[MatchTable.matchDay], Match.Round.valueOf(row[MatchTable.round].value), row[MatchTable.state], row[homeTeamTable[TeamTable.ranking]], row[awayTeamTable[TeamTable.ranking]], row[MatchTable.homeScore], row[MatchTable.awayScore])
                } ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Match does not exist"))
        }
        Response(Status.OK).body(match.toJson())
    },
    "/match/{matchId}/complete" bind Method.POST to { req ->
        requireAdmin(contexts, req) ?: run {
            val matchId = req.path("matchId")!!
            val body: CompleteMatchRequest = req.bodyString().fromJson()
            endMatch(matchId, body.homeScore, body.awayScore, leaderboardService)
            Response(Status.OK)
        }
    },
)

private fun listMatches(requesterUserId: String, filterType: String?, userId: String?): List<Match> {
    val matches = transaction {
        val awayTeamTable = TeamTable.alias("awayTeam")
        val homeTeamTable = TeamTable.alias("homeTeam")
        if (userId != null && userId != requesterUserId && filterType?.let { Match.State.valueOf(it.uppercase()) } == Match.State.UPCOMING) {
            throw ApiResponseError(Response(Status.BAD_REQUEST).body("Cannot view other users upcoming predictions"))
        }
        val userIdFilter = userId ?: requesterUserId
        val predictions = PredictionTable.selectAll().where { PredictionTable.memberId eq userIdFilter }.alias("predictions")
        val matchTeamTable = MatchTable.join(awayTeamTable, JoinType.INNER, MatchTable.awayTeamId, awayTeamTable[TeamTable.id])
            .join(homeTeamTable, JoinType.INNER, MatchTable.homeTeamId, homeTeamTable[TeamTable.id])
            .join(predictions, JoinType.LEFT, MatchTable.id, predictions[PredictionTable.matchId]).selectAll()
            .orderBy(MatchTable.datetime)
        val query = if (filterType.isNullOrBlank()) matchTeamTable else matchTeamTable.where { MatchTable.state eq Match.State.valueOf(filterType.uppercase()) }
        query.map { row ->
            Match(
                row[homeTeamTable[TeamTable.name]].toTitleCase(), row[homeTeamTable[TeamTable.flagCode]],
                row[awayTeamTable[TeamTable.name]].toTitleCase(), row[awayTeamTable[TeamTable.flagCode]],
                row[MatchTable.id].toString(), row[MatchTable.venue], row[MatchTable.datetime], row[MatchTable.matchDay],
                Match.Round.valueOf(row[MatchTable.round].value), row[MatchTable.state],
                row[homeTeamTable[TeamTable.ranking]], row[awayTeamTable[TeamTable.ranking]],
                row[MatchTable.homeScore], row[MatchTable.awayScore],
                row.getOrNull(predictions[PredictionTable.id])?.let {
                    Prediction(row[predictions[PredictionTable.homeScore]], row[predictions[PredictionTable.awayScore]], row[MatchTable.id].toString(), row[predictions[PredictionTable.id]].toString(), row[predictions[PredictionTable.memberId]], row[predictions[PredictionTable.points]])
                },
            )
        }
    }
    if (!filterType.isNullOrBlank() && Match.State.valueOf(filterType.uppercase()) == Match.State.UPCOMING) {
        log.info("Filtering matches to next 2 match days")
        return getMatchesOnNextThreeDays(matches)
    }
    return matches
}

internal fun getMatchesOnNextThreeDays(matches: List<Match>): List<Match> {
    val uniqueMatchDays = matches.map { it.matchDay }.distinct()
    if (uniqueMatchDays.size < 3) return matches
    val lowestMatchDays = uniqueMatchDays.sorted().take(3)
    return matches.filter { it.matchDay in lowestMatchDays }
}
