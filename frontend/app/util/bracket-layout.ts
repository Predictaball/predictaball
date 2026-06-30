/**
 * Pure geometry/derivation for the Knockout Cup bracket tree.
 *
 * Groups a user's knockout matches into the full single-elimination tree (every
 * round padded to its expected size with TBD placeholders) and carries known
 * results forward through the empty rounds: a slot is filled only from the side
 * that actually went through, so the next round only ever shows teams that have
 * genuinely qualified — never a team from the user's predictions. When a real
 * next-round match already exists, it's seated in the slot its two feeders point
 * to rather than dumped in kickoff order. Kept free of React and the generated
 * client so it can be unit-tested in isolation (see `__tests__/bracket-layout.test.ts`).
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
    /**
     * The side the user backed to go through. Accepted on the input shape but
     * deliberately NOT used to advance a team — only known results fill the next
     * round (see `projectedTeam`).
     */
    userPick?: GoThrough
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

/**
 * The team a slot sends to the round it feeds: only the side that actually went
 * through, once that result is known. Predictions never advance a team — an
 * undecided match (or a placeholder) forwards nothing, so the next round only
 * ever shows teams that have genuinely qualified.
 */
function projectedTeam<M extends LayoutMatch>(slot: Slot<M> | undefined): DerivedTeam | undefined {
    if (slot == null || slot.kind !== "match") return undefined
    const match = slot.match
    if (match.state !== "COMPLETED" || match.actualGoThrough == null) return undefined
    return match.actualGoThrough === "HOME"
        ? { name: match.homeTeam, flag: match.homeTeamFlagCode }
        : { name: match.awayTeam, flag: match.awayTeamFlagCode }
}

/** The teams a slot could supply downstream — both sides of a real tie, or whatever a placeholder has so far. */
function slotTeams<M extends LayoutMatch>(slot: Slot<M> | undefined): string[] {
    if (slot == null) return []
    if (slot.kind === "match") return [slot.match.homeTeam, slot.match.awayTeam]
    return [slot.home?.name, slot.away?.name].filter((name): name is string => name != null)
}

/** Does this real match's two teams come from this pair of feeder slots, one from each? */
function feedsFrom<M extends LayoutMatch>(match: M, a: Slot<M> | undefined, b: Slot<M> | undefined): boolean {
    if (a == null || b == null) return false
    const fromA = slotTeams(a)
    const fromB = slotTeams(b)
    return (
        (fromA.includes(match.homeTeam) && fromB.includes(match.awayTeam)) ||
        (fromA.includes(match.awayTeam) && fromB.includes(match.homeTeam))
    )
}

/**
 * Build the full bracket: every knockout round, ordered by bracket position and
 * padded to its expected size with placeholders. Consecutive pairs (2j, 2j+1)
 * feed slot j of the next round. Each next-round slot is resolved in order:
 *
 *  1. A real match is seated beneath the feeder pair that produces its two teams,
 *     so a known fixture lands in the right place however the feeders are ordered.
 *  2. Any real match we can't seat that way (teams not yet known upstream) falls
 *     into the next free slot, preserving kickoff order.
 *  3. Remaining slots become placeholders, partially filled from the known
 *     qualifiers feeding them — never from the user's predictions.
 */
export function buildBracket<M extends LayoutMatch>(matches: M[]): RoundColumn<M>[] {
    const byRound = new Map<BracketRound, M[]>()
    for (const match of matches) {
        const bucket = byRound.get(match.round)
        if (bucket) bucket.push(match)
        else byRound.set(match.round, [match])
    }

    const columns: RoundColumn<M>[] = []
    let prev: Slot<M>[] | null = null

    for (const round of KNOCKOUT_ROUNDS) {
        const size = ROUND_SIZES[round]
        // Order by bracket position so consecutive pairs feed the right next-round
        // slot; matches without a position keep their incoming (kickoff) order.
        const remaining = [...(byRound.get(round) ?? [])].sort(
            (a, b) => (a.bracketPosition ?? Infinity) - (b.bracketPosition ?? Infinity),
        )
        const slots: Slot<M>[] = new Array<Slot<M>>(size)

        // 1. Seat real matches beneath the feeders that produce them.
        if (prev) {
            for (let j = 0; j < size; j++) {
                const idx = remaining.findIndex((match) => feedsFrom(match, prev![2 * j], prev![2 * j + 1]))
                if (idx !== -1) slots[j] = { kind: "match", match: remaining.splice(idx, 1)[0] }
            }
        }

        // 2. Seat any leftover real matches in the next free slot.
        for (const match of remaining) {
            const j = slots.findIndex((slot) => slot == null)
            if (j === -1) break
            slots[j] = { kind: "match", match }
        }

        // 3. Fill the rest with placeholders, carrying the projected feeders forward.
        for (let j = 0; j < size; j++) {
            if (slots[j] != null) continue
            slots[j] = {
                kind: "placeholder",
                id: `${round}-ph-${j}`,
                home: prev ? projectedTeam(prev[2 * j]) : undefined,
                away: prev ? projectedTeam(prev[2 * j + 1]) : undefined,
            }
        }

        columns.push({ round, slots })
        prev = slots
    }

    return columns
}
