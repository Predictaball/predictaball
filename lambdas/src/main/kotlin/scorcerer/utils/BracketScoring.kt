package scorcerer.utils

import scorcerer.server.db.tables.MatchResult
import scorcerer.server.db.tables.MatchRound

/**
 * Pure scoring for the Knockout Cup side-game.
 *
 * Each completed knockout match earns [ROUND_BASE] points for a correct pick.
 * Points escalate by round; no streak mechanic.
 *
 * Mirrored by the frontend `app/util/bracket-scoring.ts` — keep in lock-step.
 */
object BracketScoring {
    val ROUND_BASE: Map<MatchRound, Int> = mapOf(
        MatchRound.ROUND_OF_THIRTY_TWO to 1,
        MatchRound.ROUND_OF_SIXTEEN to 3,
        MatchRound.QUARTER_FINAL to 5,
        MatchRound.SEMI_FINAL to 8,
        MatchRound.FINAL to 12,
    )

    val KNOCKOUT_ROUNDS: List<MatchRound> = ROUND_BASE.keys.toList()

    data class RunMatch(
        val round: MatchRound,
        val pick: MatchResult?,
        val actual: MatchResult?,
    )

    data class MatchScore(val basePoints: Int, val correct: Boolean?)

    data class RunResult(
        val totalPoints: Int,
        val perMatch: List<MatchScore>,
    )

    fun scoreRun(matches: List<RunMatch>): RunResult {
        var total = 0
        val perMatch = matches.map { match ->
            val base = ROUND_BASE[match.round] ?: 0
            when {
                match.actual == null -> MatchScore(0, null)
                match.pick != null && match.pick == match.actual -> {
                    total += base
                    MatchScore(base, true)
                }
                else -> MatchScore(0, false)
            }
        }
        return RunResult(total, perMatch)
    }
}
