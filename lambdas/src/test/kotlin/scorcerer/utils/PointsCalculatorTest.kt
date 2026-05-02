import io.kotest.matchers.shouldBe
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.openapitools.server.models.Chip
import org.openapitools.server.models.Prediction
import scorcerer.utils.MatchResult
import scorcerer.utils.PointsCalculator

internal class PointsCalculatorTest {
    @ParameterizedTest
    @CsvSource("1, 1, 1, 1, 5", "2, 1, 3, 1, 2", "2, 5, 1, 3, 2", "1, 1, 2, 2, 2", "1, 1, 0, 1, 0")
    fun testCalculatePoints(
        predictedHomeScore: Int,
        predictedAwayScore: Int,
        homeScore: Int,
        awayScore: Int,
        expectedPoints: Int,
    ) {
        val prediction = Prediction(predictedHomeScore, Chip.NONE, predictedAwayScore, "matchId", "predictionId", "userId")
        val result = MatchResult(homeScore, awayScore)
        PointsCalculator.calculatePoints(prediction, result) shouldBe expectedPoints
    }

    @ParameterizedTest
    @CsvSource("1, 1, 1, 1, 10", "2, 1, 3, 1, 4", "2, 5, 1, 3, 4", "1, 1, 2, 2, 4", "1, 1, 0, 1, 0")
    fun testCalculatePointsDouble(
        predictedHomeScore: Int,
        predictedAwayScore: Int,
        homeScore: Int,
        awayScore: Int,
        expectedPoints: Int,
    ) {
        val prediction = Prediction(predictedHomeScore, Chip.DOUBLE_POINTS, predictedAwayScore, "matchId", "predictionId", "userId")
        val result = MatchResult(homeScore, awayScore)
        PointsCalculator.calculatePoints(prediction, result) shouldBe expectedPoints
    }

    @ParameterizedTest
    @CsvSource("1, 1, 1, 1, 5", "2, 1, 3, 1, 5", "2, 5, 1, 3, 2", "1, 1, 2, 2, 2", "1, 1, 0, 1, 5")
    fun testCalculatePointsOneGoalOut(
        predictedHomeScore: Int,
        predictedAwayScore: Int,
        homeScore: Int,
        awayScore: Int,
        expectedPoints: Int,
    ) {
        val prediction = Prediction(predictedHomeScore, Chip.ONE_GOAL_OUT, predictedAwayScore, "matchId", "predictionId", "userId")
        val result = MatchResult(homeScore, awayScore)
        PointsCalculator.calculatePoints(prediction, result) shouldBe expectedPoints
    }
}
