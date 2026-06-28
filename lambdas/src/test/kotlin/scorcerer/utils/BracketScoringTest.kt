import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.Test
import scorcerer.server.db.tables.MatchResult
import scorcerer.server.db.tables.MatchRound
import scorcerer.utils.BracketScoring
import scorcerer.utils.BracketScoring.RunMatch

/**
 * These scenarios are mirrored exactly in the frontend
 * `app/util/__tests__/bracket-scoring.test.ts`. If you change a fixture or an
 * expected total here, change it there too — the two scorers must agree.
 */
internal class BracketScoringTest {
    private val home = MatchResult.HOME
    private val away = MatchResult.AWAY
    private val r32 = MatchRound.ROUND_OF_THIRTY_TWO
    private val r16 = MatchRound.ROUND_OF_SIXTEEN

    @Test
    fun correctR32PickScoresOnePoint() {
        val result = BracketScoring.scoreRun(listOf(RunMatch(r32, home, home)))
        result.totalPoints shouldBe 1
        result.perMatch[0] shouldBe BracketScoring.MatchScore(1, true)
    }

    @Test
    fun roundBasesEscalateThroughTheRounds() {
        val run = listOf(
            RunMatch(MatchRound.ROUND_OF_THIRTY_TWO, home, home),
            RunMatch(MatchRound.ROUND_OF_SIXTEEN, home, home),
            RunMatch(MatchRound.QUARTER_FINAL, home, home),
            RunMatch(MatchRound.SEMI_FINAL, home, home),
            RunMatch(MatchRound.FINAL, home, home),
        )
        // 1 + 3 + 5 + 8 + 12 = 29
        BracketScoring.scoreRun(run).totalPoints shouldBe 29
    }

    @Test
    fun wrongPickScoresZero() {
        val result = BracketScoring.scoreRun(listOf(RunMatch(r32, home, away)))
        result.totalPoints shouldBe 0
        result.perMatch[0] shouldBe BracketScoring.MatchScore(0, false)
    }

    @Test
    fun unpredictedMatchCountsAsAMiss() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(r32, null, away),
            RunMatch(r32, away, away),
        )
        BracketScoring.scoreRun(run).totalPoints shouldBe 2
    }

    @Test
    fun pendingMatchesDoNotScore() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(MatchRound.SEMI_FINAL, home, null),
            RunMatch(r32, home, home),
        )
        val result = BracketScoring.scoreRun(run)
        result.totalPoints shouldBe 2
        result.perMatch[1].correct shouldBe null
    }

    @Test
    fun sumsMultipleCorrectPicksAcrossRounds() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(r32, home, away),
            RunMatch(r16, away, away),
        )
        // 1 + 0 + 3 = 4
        BracketScoring.scoreRun(run).totalPoints shouldBe 4
    }
}
