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
    fun streakBonusEscalatesAndCaps() {
        (0..7).map { BracketScoring.streakBonus(it) } shouldBe listOf(0, 0, 1, 2, 3, 4, 5, 5)
    }

    @Test
    fun perfectR32RunOfSixScoresBasesPlusEscalatingBonus() {
        // 6 correct R32 picks: base 6, bonuses 0+1+2+3+4+5 = 15 -> 21.
        val result = BracketScoring.scoreRun((1..6).map { RunMatch(r32, home, home) })
        result.totalPoints shouldBe 21
        result.currentStreak shouldBe 6
        result.bestStreak shouldBe 6
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
        // bases 1+3+5+8+12 = 29, bonuses 0+1+2+3+4 = 10 -> 39.
        val result = BracketScoring.scoreRun(run)
        result.totalPoints shouldBe 39
        result.currentStreak shouldBe 5
        result.bestStreak shouldBe 5
    }

    @Test
    fun aMissResetsTheStreak() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(r32, home, home),
            RunMatch(r32, home, away),
            RunMatch(r16, away, away),
            RunMatch(r16, home, home),
        )
        // 1 + 2 + 0 + 3 + 4 = 10.
        val result = BracketScoring.scoreRun(run)
        result.totalPoints shouldBe 10
        result.currentStreak shouldBe 2
        result.bestStreak shouldBe 2
    }

    @Test
    fun unpredictedMatchCountsAsAMiss() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(r32, null, away),
            RunMatch(r32, away, away),
        )
        val result = BracketScoring.scoreRun(run)
        result.totalPoints shouldBe 2
        result.currentStreak shouldBe 1
        result.bestStreak shouldBe 1
    }

    @Test
    fun pendingMatchesNeitherScoreNorBreakTheStreak() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(MatchRound.SEMI_FINAL, home, null),
            RunMatch(r32, home, home),
        )
        val result = BracketScoring.scoreRun(run)
        result.totalPoints shouldBe 3
        result.currentStreak shouldBe 2
        result.bestStreak shouldBe 2
        result.perMatch[1].correct shouldBe null
    }
}
