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
    fun firstCorrectPickEarnsBaseOnlyStreakBonusZero() {
        val result = BracketScoring.scoreRun(listOf(RunMatch(r32, home, home)))
        result.totalPoints shouldBe 1
        result.perMatch[0] shouldBe BracketScoring.MatchScore(1, 0, true)
        result.currentStreak shouldBe 1
    }

    @Test
    fun consecutiveCorrectPicksEarnEscalatingStreakBonusCappedAtThree() {
        // 5 correct R32: bases 5, bonuses 0+1+2+3+3=9 -> 14
        val result = BracketScoring.scoreRun((1..5).map { RunMatch(r32, home, home) })
        result.totalPoints shouldBe 14
        result.currentStreak shouldBe 5
    }

    @Test
    fun roundBasesEscalateThroughTheRoundsWithStreakBonus() {
        val run = listOf(
            RunMatch(MatchRound.ROUND_OF_THIRTY_TWO, home, home),
            RunMatch(MatchRound.ROUND_OF_SIXTEEN, home, home),
            RunMatch(MatchRound.QUARTER_FINAL, home, home),
            RunMatch(MatchRound.SEMI_FINAL, home, home),
            RunMatch(MatchRound.FINAL, home, home),
        )
        // bases 1+3+5+8+12=29, bonuses 0+1+2+3+3=9 -> 38
        BracketScoring.scoreRun(run).totalPoints shouldBe 38
    }

    @Test
    fun thirdPlacePlayoffScoresLikeASemiFinal() {
        val run = listOf(
            RunMatch(MatchRound.SEMI_FINAL, home, home),
            RunMatch(MatchRound.THIRD_PLACE_PLAYOFF, home, home),
            RunMatch(MatchRound.FINAL, home, home),
        )
        // bases 8+8+12=28, bonuses 0+1+2=3 -> 31
        val result = BracketScoring.scoreRun(run)
        result.totalPoints shouldBe 31
        result.perMatch[1] shouldBe BracketScoring.MatchScore(8, 1, true)
    }

    @Test
    fun aMissResetsTheStreak() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(r32, home, home),
            RunMatch(r32, home, away),
            RunMatch(r16, away, away),
        )
        // (1+0) + (1+1) + 0 + (3+0) = 6
        val result = BracketScoring.scoreRun(run)
        result.totalPoints shouldBe 6
        result.currentStreak shouldBe 1
    }

    @Test
    fun unpredictedMatchCountsAsAMiss() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(r32, null, away),
            RunMatch(r32, away, away),
        )
        // (1+0) + 0 + (1+0) = 2
        BracketScoring.scoreRun(run).totalPoints shouldBe 2
    }

    @Test
    fun pendingMatchesNeitherScoreNorBreakTheStreak() {
        val run = listOf(
            RunMatch(r32, home, home),
            RunMatch(MatchRound.SEMI_FINAL, home, null),
            RunMatch(r32, home, home),
        )
        // (1+0) + pending + (1+1) = 3; streak continues through pending
        val result = BracketScoring.scoreRun(run)
        result.totalPoints shouldBe 3
        result.currentStreak shouldBe 2
        result.perMatch[1].correct shouldBe null
    }
}
