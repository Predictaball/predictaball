package scorcerer.server.services

import kotlinx.coroutines.runBlocking
import org.http4k.core.Response
import org.http4k.core.Status
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.intLiteral
import org.jetbrains.exposed.v1.core.plus
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import org.openapitools.server.models.Chip
import org.openapitools.server.models.Match
import org.openapitools.server.models.Prediction
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.MatchResult
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.log
import scorcerer.utils.LeaderboardService
import scorcerer.utils.PointsCalculator.calculatePoints
import scorcerer.utils.MatchResult as Scoreline

fun endMatch(
    matchId: String,
    homeScore: Int,
    awayScore: Int,
    leaderboardService: LeaderboardService,
    tournamentStateService: TournamentStateService = TournamentStateService(),
    // Explicit go-through (e.g. ESPN's penalty-shootout winner); null = derive from score.
    goThrough: MatchResult? = null,
) = transaction {
    val matchDay = getMatchDay(matchId)
        ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Match does not exist"))

    val matchState = MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }.first()[MatchTable.state]
    if (matchState != Match.State.LIVE) {
        log.info("Cannot complete match as it is not live")
        throw ApiResponseError(Response(Status.BAD_REQUEST).body("Match is not live"))
    }

    MatchTable.update({ MatchTable.id eq matchId.toInt() }) {
        it[state] = Match.State.COMPLETED
        it[MatchTable.homeScore] = homeScore
        it[MatchTable.awayScore] = awayScore
        // Which side went through, for the Knockout Cup. Prefer the explicit
        // winner (penalty shootouts); else derive from score (null on a draw).
        it[MatchTable.result] = goThrough ?: goThroughFromScore(homeScore, awayScore)
    }

    val pointsByMember = scorePredictions(matchId, homeScore, awayScore)
    batchUpdateMemberFixedPoints(pointsByMember)

    runBlocking {
        leaderboardService.updateGlobalLeaderboard(matchDay)
        leaderboardService.updateCountryRankings()
    }
    tournamentStateService.invalidateCache()
}

// Record the Knockout Cup go-through on a match that completed without one.
// A knockout tie decided on penalties has a level score, so the completing tick
// can leave result null when ESPN hasn't yet flagged the winner; a later tick
// calls this once the winner is known. Only a completed match still missing its
// result is touched — the scoreline and prediction points were already finalised
// when the match ended, so they're left untouched; only the go-through is filled.
fun backfillGoThrough(
    matchId: String,
    goThrough: MatchResult,
    tournamentStateService: TournamentStateService = TournamentStateService(),
) = transaction {
    val row = MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }.firstOrNull()
        ?: throw ApiResponseError(Response(Status.BAD_REQUEST).body("Match does not exist"))
    if (row[MatchTable.state] != Match.State.COMPLETED || row[MatchTable.result] != null) {
        log.info("Not backfilling go-through for match $matchId (state=${row[MatchTable.state]}, result already set=${row[MatchTable.result] != null})")
        return@transaction
    }

    MatchTable.update({ MatchTable.id eq matchId.toInt() }) {
        it[result] = goThrough
    }
    tournamentStateService.invalidateCache()
}

fun setScore(
    matchId: String,
    matchDay: Int,
    homeScore: Int,
    awayScore: Int,
    leaderboardService: LeaderboardService,
    tournamentStateService: TournamentStateService = TournamentStateService(),
) = transaction {
    val matchState = MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }.first()[MatchTable.state]
    if (matchState == Match.State.COMPLETED) {
        log.info("Cannot update score for completed match")
        return@transaction
    }

    if (matchState == Match.State.UPCOMING) {
        substituteCrowdPredictions(matchId)
        persistPredictionDistribution(matchId)
    }

    MatchTable.update({ MatchTable.id eq matchId.toInt() }) {
        it[MatchTable.homeScore] = homeScore
        it[MatchTable.awayScore] = awayScore
        it[state] = Match.State.LIVE
    }

    scorePredictions(matchId, homeScore, awayScore)

    runBlocking {
        leaderboardService.updateGlobalLeaderboard(matchDay)
        leaderboardService.updateCountryRankings()
    }
    tournamentStateService.invalidateCache()
}

private fun substituteCrowdPredictions(matchId: String) {
    val matchIdInt = matchId.toInt()
    val all = PredictionTable.selectAll().where { PredictionTable.matchId eq matchIdInt }.toList()
    val crowdIds = all.filter { it[PredictionTable.chip] == Chip.CROWD }.map { it[PredictionTable.id] }
    if (crowdIds.isEmpty()) return

    val nonCrowdScores = all
        .filter { it[PredictionTable.chip] != Chip.CROWD }
        .map { it[PredictionTable.homeScore] to it[PredictionTable.awayScore] }

    val (chosenHome, chosenAway) = if (nonCrowdScores.isEmpty()) {
        0 to 0
    } else {
        nonCrowdScores.groupingBy { it }.eachCount()
            .entries
            .sortedWith(
                compareByDescending<Map.Entry<Pair<Int, Int>, Int>> { it.value }
                    .thenBy { it.key.first + it.key.second }
                    .thenBy { it.key.first },
            )
            .first().key
    }

    PredictionTable.update({ PredictionTable.id inList crowdIds }) {
        it[homeScore] = chosenHome
        it[awayScore] = chosenAway
    }
    log.info("CROWD substitution for match $matchId: ${crowdIds.size} predictions set to $chosenHome-$chosenAway")
}

private fun persistPredictionDistribution(matchId: String) {
    val matchIdInt = matchId.toInt()
    var home = 0
    var draw = 0
    var away = 0
    PredictionTable.select(PredictionTable.homeScore, PredictionTable.awayScore, PredictionTable.chip)
        .where { PredictionTable.matchId eq matchIdInt }
        .forEach { row ->
            if (row[PredictionTable.chip] == Chip.CROWD) return@forEach
            val h = row[PredictionTable.homeScore]
            val a = row[PredictionTable.awayScore]
            when {
                h > a -> home++
                h < a -> away++
                else -> draw++
            }
        }
    MatchTable.update({ MatchTable.id eq matchIdInt }) {
        it[homePredictions] = home
        it[drawPredictions] = draw
        it[awayPredictions] = away
    }
}

fun getMatchDay(matchId: String): Int? = transaction {
    MatchTable.select(MatchTable.matchDay).where { MatchTable.id eq matchId.toInt() }.firstOrNull()
        ?.let { row -> row[MatchTable.matchDay] }
}

fun recalculateAllFixedPoints() = transaction {
    log.info("Recalculating all fixed points from scratch")
    MemberTable.update { it[fixedPoints] = intLiteral(0) }

    val completedMatches = MatchTable.selectAll()
        .where { MatchTable.state eq Match.State.COMPLETED }
        .map { Triple(it[MatchTable.id].toString(), it[MatchTable.homeScore]!!, it[MatchTable.awayScore]!!) }

    val totalPointsByMember = mutableMapOf<String, Int>()
    completedMatches.forEach { (matchId, homeScore, awayScore) ->
        scorePredictions(matchId, homeScore, awayScore).forEach { (userId, points) ->
            totalPointsByMember.merge(userId, points, Int::plus)
        }
    }

    totalPointsByMember.forEach { (userId, points) ->
        MemberTable.update({ MemberTable.id eq userId }) {
            it[fixedPoints] = intLiteral(points)
        }
    }
    log.info("Recalculated fixed points for ${totalPointsByMember.size} members across ${completedMatches.size} matches")
}

// Who progresses, derived from the final score. Null on a level score: group-stage
// draws never go through, and a knockout decided on penalties isn't distinguishable
// from the scoreline alone.
private fun goThroughFromScore(homeScore: Int, awayScore: Int): MatchResult? = when {
    homeScore > awayScore -> MatchResult.HOME
    awayScore > homeScore -> MatchResult.AWAY
    else -> null
}

private fun scorePredictions(matchId: String, homeScore: Int, awayScore: Int): Map<String, Int> {
    val result = Scoreline(homeScore, awayScore)
    val predictions = getPredictions(matchId)
    val pointsByPrediction = predictions.associate { it.predictionId.toInt() to calculatePoints(it, result) }
    batchUpdatePredictionPoints(pointsByPrediction)
    return predictions.groupBy { it.userId }
        .mapValues { (_, preds) -> preds.sumOf { pointsByPrediction[it.predictionId.toInt()] ?: 0 } }
}

private fun getPredictions(matchId: String): List<Prediction> =
    PredictionTable.selectAll().where { PredictionTable.matchId eq matchId.toInt() }.map { row ->
        Prediction(
            row[PredictionTable.homeScore],
            row[PredictionTable.chip],
            row[PredictionTable.awayScore],
            row[PredictionTable.matchId].toString(),
            row[PredictionTable.id].toString(),
            row[PredictionTable.memberId],
        )
    }

private fun batchUpdatePredictionPoints(pointsByPrediction: Map<Int, Int>) {
    pointsByPrediction.entries.groupBy { it.value }.forEach { (points, entries) ->
        val ids = entries.map { it.key }
        PredictionTable.update({ PredictionTable.id inList ids }) {
            it[PredictionTable.points] = points
        }
    }
}

private fun batchUpdateMemberFixedPoints(pointsByMember: Map<String, Int>) {
    pointsByMember.forEach { (userId, points) ->
        MemberTable.update({ MemberTable.id eq userId }) {
            it[fixedPoints] = fixedPoints + intLiteral(points)
        }
    }
}
