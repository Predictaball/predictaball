import { RunMatch, scoreRun, streakBonus } from "@/app/util/bracket-scoring"

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
    it("escalates and caps the streak bonus", () => {
        expect([0, 1, 2, 3, 4, 5, 6, 7].map(streakBonus)).toEqual([0, 0, 1, 2, 3, 4, 5, 5])
    })

    it("scores a perfect R32 run of six as bases plus escalating bonus", () => {
        // base 6, bonuses 0+1+2+3+4+5 = 15 -> 21.
        const run: RunMatch[] = Array.from({ length: 6 }, () => ({ round: r32, pick: home, actual: home }))
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(21)
        expect(result.currentStreak).toBe(6)
        expect(result.bestStreak).toBe(6)
    })

    it("escalates base points through the rounds", () => {
        const run: RunMatch[] = [
            { round: "ROUND_OF_THIRTY_TWO", pick: home, actual: home },
            { round: "ROUND_OF_SIXTEEN", pick: home, actual: home },
            { round: "QUARTER_FINAL", pick: home, actual: home },
            { round: "SEMI_FINAL", pick: home, actual: home },
            { round: "FINAL", pick: home, actual: home },
        ]
        // bases 1+3+5+8+12 = 29, bonuses 0+1+2+3+4 = 10 -> 39.
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(39)
        expect(result.currentStreak).toBe(5)
        expect(result.bestStreak).toBe(5)
    })

    it("resets the streak on a miss", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: r32, pick: home, actual: home },
            { round: r32, pick: home, actual: away },
            { round: r16, pick: away, actual: away },
            { round: r16, pick: home, actual: home },
        ]
        // 1 + 2 + 0 + 3 + 4 = 10.
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(10)
        expect(result.currentStreak).toBe(2)
        expect(result.bestStreak).toBe(2)
    })

    it("treats an unpredicted match as a miss", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: r32, pick: undefined, actual: away },
            { round: r32, pick: away, actual: away },
        ]
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(2)
        expect(result.currentStreak).toBe(1)
        expect(result.bestStreak).toBe(1)
    })

    it("does not score or break the streak on pending matches", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: "SEMI_FINAL", pick: home, actual: undefined },
            { round: r32, pick: home, actual: home },
        ]
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(3)
        expect(result.currentStreak).toBe(2)
        expect(result.bestStreak).toBe(2)
        expect(result.perMatch[1].correct).toBeUndefined()
    })
})
