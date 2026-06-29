import { LayoutMatch, ROUND_SIZES, Slot, buildBracket } from "@/app/util/bracket-layout"

const r32 = "ROUND_OF_THIRTY_TWO" as const
const r16 = "ROUND_OF_SIXTEEN" as const

function r32Match(position: number, overrides: Partial<LayoutMatch> = {}): LayoutMatch {
    return {
        round: r32,
        state: "UPCOMING",
        homeTeam: `Home ${position}`,
        homeTeamFlagCode: `h${position}`,
        awayTeam: `Away ${position}`,
        awayTeamFlagCode: `a${position}`,
        bracketPosition: position,
        ...overrides,
    }
}

function placeholders(slots: Slot<LayoutMatch>[]): Array<{ home?: string; away?: string }> {
    return slots
        .filter((s): s is Extract<Slot<LayoutMatch>, { kind: "placeholder" }> => s.kind === "placeholder")
        .map((s) => ({ home: s.home?.name, away: s.away?.name }))
}

describe("buildBracket", () => {
    it("renders the full tree padded to each round's expected size", () => {
        const rounds = buildBracket([r32Match(1)])
        expect(rounds.map((c) => c.round)).toEqual([
            "ROUND_OF_THIRTY_TWO",
            "ROUND_OF_SIXTEEN",
            "QUARTER_FINAL",
            "SEMI_FINAL",
            "FINAL",
        ])
        rounds.forEach((column) => {
            expect(column.slots.length).toBe(ROUND_SIZES[column.round])
        })
        // The single real match keeps its slot; the rest of R32 is placeholders.
        expect(rounds[0].slots[0]).toEqual({ kind: "match", match: expect.objectContaining({ bracketPosition: 1 }) })
        expect(rounds[0].slots[1]).toMatchObject({ kind: "placeholder" })
    })

    it("orders a round by bracket position regardless of input order", () => {
        const rounds = buildBracket([r32Match(3), r32Match(1), r32Match(2)])
        const positions = rounds[0].slots
            .filter((s): s is Extract<Slot<LayoutMatch>, { kind: "match" }> => s.kind === "match")
            .map((s) => s.match.bracketPosition)
        expect(positions).toEqual([1, 2, 3])
    })

    it("partially fills the fed slot when one feeder is decided", () => {
        // Slots 1 & 2 of R32 feed slot 0 of R16. Only slot 1 (home) is decided.
        const rounds = buildBracket([
            r32Match(1, { state: "COMPLETED", actualGoThrough: "HOME" }),
            r32Match(2),
        ])
        const r16Slots = placeholders(rounds.find((c) => c.round === r16)!.slots)
        expect(r16Slots[0]).toEqual({ home: "Home 1", away: undefined })
    })

    it("fully fills the fed slot when both feeders are decided", () => {
        const rounds = buildBracket([
            r32Match(1, { state: "COMPLETED", actualGoThrough: "AWAY" }),
            r32Match(2, { state: "COMPLETED", actualGoThrough: "HOME" }),
        ])
        const r16Slots = placeholders(rounds.find((c) => c.round === r16)!.slots)
        expect(r16Slots[0]).toEqual({ home: "Away 1", away: "Home 2" })
    })

    it("leaves a slot empty until at least one feeder completes", () => {
        const rounds = buildBracket([r32Match(1), r32Match(2)])
        const r16Slots = placeholders(rounds.find((c) => c.round === r16)!.slots)
        expect(r16Slots[0]).toEqual({ home: undefined, away: undefined })
    })
})
