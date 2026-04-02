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
import org.openapitools.server.models.Match
import org.openapitools.server.models.Prediction
import scorcerer.server.ApiResponseError
import scorcerer.server.db.tables.MatchTable
import scorcerer.server.db.tables.MemberTable
import scorcerer.server.db.tables.PredictionTable
import scorcerer.server.log
import scorcerer.utils.LeaderboardS3Service
import scorcerer.utils.MatchResult
import scorcerer.utils.PointsCalculator.calculatePoints

fun endMatch(matchId: String, homeScore: Int, awayScore: Int, leaderboardService: LeaderboardS3Service) = transaction {
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
    }

    val pointsByMember = scorePredictions(matchId, homeScore, awayScore)
    batchUpdateMemberFixedPoints(pointsByMember)

    runBlocking {
        leaderboardService.updateGlobalLeaderboard(matchDay)
    }
}

fun setScore(matchId: String, matchDay: Int, homeScore: Int, awayScore: Int, leaderboardService: LeaderboardS3Service) =
    transaction {
        val matchState = MatchTable.selectAll().where { MatchTable.id eq matchId.toInt() }.first()[MatchTable.state]
        if (matchState == Match.State.COMPLETED) {
            log.info("Cannot update score for completed match")
            return@transaction
        }

        MatchTable.update({ MatchTable.id eq matchId.toInt() }) {
            it[MatchTable.homeScore] = homeScore
            it[MatchTable.awayScore] = awayScore
            it[state] = Match.State.LIVE
        }

        scorePredictions(matchId, homeScore, awayScore)

        runBlocking {
            leaderboardService.updateGlobalLeaderboard(matchDay)
        }
    }

fun getMatchDay(matchId: String): Int? = transaction {
    MatchTable.select(MatchTable.matchDay).where { MatchTable.id eq matchId.toInt() }.firstOrNull()
        ?.let { row -> row[MatchTable.matchDay] }
}

private fun scorePredictions(matchId: String, homeScore: Int, awayScore: Int): Map<String, Int> {
    val result = MatchResult(homeScore, awayScore)
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
