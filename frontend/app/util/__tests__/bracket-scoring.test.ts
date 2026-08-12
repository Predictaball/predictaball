import { RunMatch, scoreRun } from "@/app/util/bracket-scoring"

/**
 * These scenarios are mirrored exactly in the backend
 * `lambdas/.../scorcerer/utils/BracketScoringTest.kt`. If you change a fixture or
 * an expected total here, change it there too — the two scorers must agree.
 */

const r32 = "ROUND_OF_THIRTY_TWO" as const
const r16 = "ROUND_OF_SIXTEEN" as const
const home = "HOME" as const
const away = "AWAY" as const

describe("bracket-scoring", () => {
    it("first correct pick earns base only (streak bonus = 0)", () => {
        const result = scoreRun([{ round: r32, pick: home, actual: home }])
        expect(result.totalPoints).toBe(1)
        expect(result.perMatch[0]).toEqual({ basePoints: 1, bonusPoints: 0, correct: true })
        expect(result.currentStreak).toBe(1)
    })

    it("consecutive correct picks earn escalating streak bonus, capped at +3", () => {
        // 5 correct R32 picks: bases 5, bonuses 0+1+2+3+3=9 -> 14
        const run: RunMatch[] = Array.from({ length: 5 }, () => ({ round: r32, pick: home, actual: home }))
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(14)
        expect(result.currentStreak).toBe(5)
    })

    it("escalates base points through the rounds with streak bonus", () => {
        const run: RunMatch[] = [
            { round: "ROUND_OF_THIRTY_TWO", pick: home, actual: home },
            { round: "ROUND_OF_SIXTEEN", pick: home, actual: home },
            { round: "QUARTER_FINAL", pick: home, actual: home },
            { round: "SEMI_FINAL", pick: home, actual: home },
            { round: "FINAL", pick: home, actual: home },
        ]
        // bases 1+3+5+8+12=29, bonuses 0+1+2+3+3=9 -> 38
        expect(scoreRun(run).totalPoints).toBe(38)
    })

    it("scores the third-place playoff like a semi-final", () => {
        const run: RunMatch[] = [
            { round: "SEMI_FINAL", pick: home, actual: home },
            { round: "THIRD_PLACE_PLAYOFF", pick: home, actual: home },
            { round: "FINAL", pick: home, actual: home },
        ]
        // bases 8+8+12=28, bonuses 0+1+2=3 -> 31
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(31)
        expect(result.perMatch[1]).toEqual({ basePoints: 8, bonusPoints: 1, correct: true })
    })

    it("resets the streak on a miss", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: r32, pick: home, actual: home },
            { round: r32, pick: home, actual: away },
            { round: r16, pick: away, actual: away },
        ]
        // (1+0) + (1+1) + 0 + (3+0) = 6
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(6)
        expect(result.currentStreak).toBe(1)
    })

    it("treats an unpredicted match as a miss", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: r32, pick: undefined, actual: away },
            { round: r32, pick: away, actual: away },
        ]
        // (1+0) + 0 + (1+0) = 2
        expect(scoreRun(run).totalPoints).toBe(2)
    })

    it("does not score or break the streak on pending matches", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: "SEMI_FINAL", pick: home, actual: undefined },
            { round: r32, pick: home, actual: home },
        ]
        // (1+0) + pending + (1+1) = 3; streak continues through pending
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(3)
        expect(result.currentStreak).toBe(2)
        expect(result.perMatch[1].correct).toBeUndefined()
    })
})
