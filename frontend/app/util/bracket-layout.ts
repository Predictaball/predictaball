/**
 * Pure geometry/derivation for the Knockout Cup bracket tree.
 *
 * Groups a user's knockout matches into the full single-elimination tree (every
 * round padded to its expected size with TBD placeholders) and, where a match's
 * feeder results are already known, fills the next round's empty slots with the
 * teams that went through. Kept free of React and the generated client so it can
 * be unit-tested in isolation (see `__tests__/bracket-layout.test.ts`).
 */

import { BracketRound, GoThrough, KNOCKOUT_ROUNDS } from "./bracket-scoring"

/** Expected match count per round in a standard 32-team knockout. */
export const ROUND_SIZES: Record<BracketRound, number> = {
    ROUND_OF_THIRTY_TWO: 16,
    ROUND_OF_SIXTEEN: 8,
    QUARTER_FINAL: 4,
    SEMI_FINAL: 2,
    FINAL: 1,
}

/** The minimum shape `buildBracket` needs from a match to lay out and resolve it. */
export interface LayoutMatch {
    round: BracketRound
    state: "LIVE" | "UPCOMING" | "COMPLETED"
    homeTeam: string
    homeTeamFlagCode: string
    awayTeam: string
    awayTeamFlagCode: string
    actualGoThrough?: GoThrough
    bracketPosition?: number | null
}

/** A team derived into an as-yet-unplayed slot from a completed feeder. */
export interface DerivedTeam {
    name: string
    flag: string
}

/**
 * A real match, or a TBD placeholder that may have one/both feeder winners filled
 * in once the matches feeding it have completed.
 */
export type Slot<M> =
    | { kind: "match"; match: M }
    | { kind: "placeholder"; id: string; home?: DerivedTeam; away?: DerivedTeam }

export interface RoundColumn<M> {
    round: BracketRound
    slots: Slot<M>[]
}

/** The side that went through a completed match, or undefined while undecided. */
function winnerOf(match: LayoutMatch): DerivedTeam | undefined {
    if (match.state !== "COMPLETED" || match.actualGoThrough == null) return undefined
    return match.actualGoThrough === "HOME"
        ? { name: match.homeTeam, flag: match.homeTeamFlagCode }
        : { name: match.awayTeam, flag: match.awayTeamFlagCode }
}

/**
 * Build the full bracket: every knockout round, ordered by bracket position and
 * padded to its expected size with placeholders. Consecutive pairs (2j, 2j+1)
 * feed slot j of the next round, so any completed feeder's winner is carried
 * forward into the (otherwise empty) slot it feeds — partially filling a slot
 * when one feeder is decided, fully when both are.
 */
export function buildBracket<M extends LayoutMatch>(matches: M[]): RoundColumn<M>[] {
    const byRound = new Map<BracketRound, M[]>()
    for (const match of matches) {
        const bucket = byRound.get(match.round)
        if (bucket) bucket.push(match)
        else byRound.set(match.round, [match])
    }

    const columns: RoundColumn<M>[] = KNOCKOUT_ROUNDS.map((round) => {
        // Order by bracket position so consecutive pairs feed the right next-round
        // slot; matches without a position keep their incoming (kickoff) order.
        const real = [...(byRound.get(round) ?? [])].sort(
            (a, b) => (a.bracketPosition ?? Infinity) - (b.bracketPosition ?? Infinity),
        )
        const slots: Slot<M>[] = real.map((match): Slot<M> => ({ kind: "match", match }))
        for (let i = slots.length; i < ROUND_SIZES[round]; i++) {
            slots.push({ kind: "placeholder", id: `${round}-ph-${i}` })
        }
        return { round, slots }
    })

    // Carry feeder winners forward, round by round, into the slots they feed.
    let prevWinners: (DerivedTeam | undefined)[] | null = null
    for (const column of columns) {
        const winners = column.slots.map((slot, j): DerivedTeam | undefined => {
            if (slot.kind === "match") return winnerOf(slot.match)
            if (prevWinners) {
                slot.home = prevWinners[2 * j]
                slot.away = prevWinners[2 * j + 1]
            }
            // A placeholder is an unplayed match: it never has a winner to forward.
            return undefined
        })
        prevWinners = winners
    }

    return columns
}
