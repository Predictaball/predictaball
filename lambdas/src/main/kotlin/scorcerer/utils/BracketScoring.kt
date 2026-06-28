package scorcerer.utils

import scorcerer.server.db.tables.MatchResult
import scorcerer.server.db.tables.MatchRound

/**
 * Pure scoring for the Knockout Cup side-game.
 *
 * The cup is a scoring lens over the per-match knockout predictions users already
 * make (the side they back to go through, [MatchResult] HOME/AWAY). For each
 * completed knockout match, in kickoff order:
 *   - a pick is correct iff it matches the side that actually went through;
 *   - a correct pick earns [ROUND_BASE] for its round plus a kickoff-order streak
 *     bonus; any miss (wrong or unpredicted) resets the streak.
 *
 * This is the single source of truth for the rules and is mirrored by the
 * frontend `app/util/bracket-scoring.ts` — keep the two in lock-step (the unit
 * tests on both sides share identical fixtures).
 */
object BracketScoring {
    /**
     * Base points per correct pick, escalating by round. The third-place playoff
     * and group stage are intentionally absent (not on the championship path).
     */
    val ROUND_BASE: Map<MatchRound, Int> = mapOf(
        MatchRound.ROUND_OF_THIRTY_TWO to 1,
        MatchRound.ROUND_OF_SIXTEEN to 3,
        MatchRound.QUARTER_FINAL to 5,
        MatchRound.SEMI_FINAL to 8,
        MatchRound.FINAL to 12,
    )

    /** Knockout rounds that count toward the cup, earliest first. */
    val KNOCKOUT_ROUNDS: List<MatchRound> = ROUND_BASE.keys.toList()

    const val MAX_STREAK_BONUS = 5

    /**
     * Bonus for the nth consecutive correct pick (1-indexed): the 1st in a streak
     * adds 0, the 2nd +1, the 3rd +2 … capped at [MAX_STREAK_BONUS].
     */
    fun streakBonus(streak: Int): Int = (streak - 1).coerceIn(0, MAX_STREAK_BONUS)

    /** One knockout match in a user's run, already in kickoff order. */
    data class RunMatch(
        val round: MatchRound,
        /** Side the user backed to go through, or null if they did not predict it. */
        val pick: MatchResult?,
        /** Side that actually went through, or null if the match is not yet decided. */
        val actual: MatchResult?,
    )

    /** Points a single match contributed; [correct] is null while the match is pending. */
    data class MatchScore(val basePoints: Int, val bonusPoints: Int, val correct: Boolean?)

    data class RunResult(
        val totalPoints: Int,
        val currentStreak: Int,
        val bestStreak: Int,
        val perMatch: List<MatchScore>,
    )

    /**
     * Replay a user's knockout matches (in kickoff order) into a running score.
     * Matches that are not yet decided ([RunMatch.actual] == null) are pending:
     * they neither score nor affect the streak.
     */
    fun scoreRun(matches: List<RunMatch>): RunResult {
        var total = 0
        var streak = 0
        var best = 0
        val perMatch = matches.map { match ->
            val base = ROUND_BASE[match.round] ?: 0
            if (match.actual == null) {
                MatchScore(0, 0, null)
            } else if (match.pick != null && match.pick == match.actual) {
                streak += 1
                val bonus = streakBonus(streak)
                total += base + bonus
                best = maxOf(best, streak)
                MatchScore(base, bonus, true)
            } else {
                streak = 0
                MatchScore(0, 0, false)
            }
        }
        return RunResult(total, streak, best, perMatch)
    }
}
