/**
 * Pure scoring for the Knockout Cup side-game — the frontend mirror of the
 * backend `scorcerer.utils.BracketScoring`. The two must agree: the unit tests
 * on both sides share identical fixtures (see `__tests__/bracket-scoring.test.ts`
 * and `BracketScoringTest.kt`).
 *
 * The cup scores the per-match knockout picks users already make (the side they
 * back to go through). For each completed knockout match, in kickoff order, a
 * correct pick earns base points that escalate by round plus a kickoff-order
 * streak bonus; any miss (wrong or unpredicted) resets the streak.
 *
 * The backend is authoritative for the points shown in the UI; this module is
 * for client-side projection and to lock the rules under test.
 */

// String values are identical to the generated `BracketMatchRoundEnum` /
// `ToGoThrough`, so values flow between them without conversion.
export type BracketRound =
    | "ROUND_OF_THIRTY_TWO"
    | "ROUND_OF_SIXTEEN"
    | "QUARTER_FINAL"
    | "SEMI_FINAL"
    | "FINAL"

export type GoThrough = "HOME" | "AWAY"

/** Base points per correct pick, escalating by round. */
export const ROUND_BASE: Record<BracketRound, number> = {
    ROUND_OF_THIRTY_TWO: 1,
    ROUND_OF_SIXTEEN: 3,
    QUARTER_FINAL: 5,
    SEMI_FINAL: 8,
    FINAL: 12,
}

/** Knockout rounds that count toward the cup, earliest first. */
export const KNOCKOUT_ROUNDS: BracketRound[] = [
    "ROUND_OF_THIRTY_TWO",
    "ROUND_OF_SIXTEEN",
    "QUARTER_FINAL",
    "SEMI_FINAL",
    "FINAL",
]

export const ROUND_LABELS: Record<BracketRound, string> = {
    ROUND_OF_THIRTY_TWO: "Round of 32",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-finals",
    SEMI_FINAL: "Semi-finals",
    FINAL: "Final",
}

export const ROUND_SHORT_LABELS: Record<BracketRound, string> = {
    ROUND_OF_THIRTY_TWO: "R32",
    ROUND_OF_SIXTEEN: "R16",
    QUARTER_FINAL: "QF",
    SEMI_FINAL: "SF",
    FINAL: "Final",
}

/** One knockout match in a user's run, already in kickoff order. */
export interface RunMatch {
    round: BracketRound
    /** Side the user backed to go through, or undefined if they did not predict it. */
    pick?: GoThrough
    /** Side that actually went through, or undefined if the match is not yet decided. */
    actual?: GoThrough
}

/** Points a single match contributed; `correct` is undefined while pending. */
export interface MatchScore {
    basePoints: number
    bonusPoints: number
    correct?: boolean
}

export interface RunResult {
    totalPoints: number
    currentStreak: number
    perMatch: MatchScore[]
}

/**
 * Replay a user's knockout matches into a running score.
 * Each consecutive correct pick earns an extra +1 (uncapped streak bonus).
 * Matches that are not yet decided (`actual` undefined) are pending and score nothing.
 */
export function scoreRun(matches: RunMatch[]): RunResult {
    let totalPoints = 0
    let streak = 0
    const perMatch = matches.map((match): MatchScore => {
        const base = ROUND_BASE[match.round] ?? 0
        if (match.actual == null) return { basePoints: 0, bonusPoints: 0, correct: undefined }
        if (match.pick != null && match.pick === match.actual) {
            streak += 1
            const bonus = Math.min(streak - 1, 5)
            totalPoints += base + bonus
            return { basePoints: base, bonusPoints: bonus, correct: true }
        }
        streak = 0
        return { basePoints: 0, bonusPoints: 0, correct: false }
    })
    return { totalPoints, currentStreak: streak, perMatch }
}
