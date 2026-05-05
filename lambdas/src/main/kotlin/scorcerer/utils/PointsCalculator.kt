package scorcerer.utils

import org.openapitools.server.models.Chip
import org.openapitools.server.models.Prediction

data class MatchResult(
    val homeScore: Int,
    val awayScore: Int,
)
object PointsCalculator {
    fun calculateDefaultPoints(homePrediction: Int, awayPrediction: Int, result: MatchResult): Int {
        return when {
            awayPrediction == result.awayScore && homePrediction == result.homeScore -> 5
            homePrediction < awayPrediction && result.homeScore < result.awayScore -> 2
            homePrediction > awayPrediction && result.homeScore > result.awayScore -> 2
            homePrediction == awayPrediction && result.homeScore == result.awayScore -> 2
            else -> 0
        }
    }

    fun calculatePoints(prediction: Prediction, result: MatchResult): Int {
        val defaultPoints = calculateDefaultPoints(prediction.homeScore, prediction.awayScore, result)
        return when (prediction.chip) {
            Chip.ONE_GOAL_OUT -> calculatePointsOneGoalOut(defaultPoints, prediction, result)
            Chip.DOUBLE_POINTS -> 2 * defaultPoints
            Chip.NONE, Chip.CROWD -> defaultPoints
        }
    }

    fun calculatePointsOneGoalOut(currentPoints: Int, prediction: Prediction, result: MatchResult): Int {
        if (currentPoints == 5) {
            return 5
        }
        val adjustments = listOf(
            Score(prediction.homeScore + 1, prediction.awayScore),
            Score(maxOf(0, prediction.homeScore - 1), prediction.awayScore),
            Score(prediction.homeScore, prediction.awayScore + 1),
            Score(prediction.homeScore, maxOf(0, prediction.awayScore - 1)),
        )
        return adjustments.maxOf { calculateDefaultPoints(it.home, it.away, result) }
            .coerceAtLeast(currentPoints)
    }

    data class Score(val home: Int, val away: Int)
}
