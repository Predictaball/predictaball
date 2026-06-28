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
    it("scores a correct R32 pick as 1 point", () => {
        const result = scoreRun([{ round: r32, pick: home, actual: home }])
        expect(result.totalPoints).toBe(1)
        expect(result.perMatch[0]).toEqual({ basePoints: 1, correct: true })
    })

    it("escalates base points through the rounds", () => {
        const run: RunMatch[] = [
            { round: "ROUND_OF_THIRTY_TWO", pick: home, actual: home },
            { round: "ROUND_OF_SIXTEEN", pick: home, actual: home },
            { round: "QUARTER_FINAL", pick: home, actual: home },
            { round: "SEMI_FINAL", pick: home, actual: home },
            { round: "FINAL", pick: home, actual: home },
        ]
        // 1 + 3 + 5 + 8 + 12 = 29
        expect(scoreRun(run).totalPoints).toBe(29)
    })

    it("scores zero for a wrong pick", () => {
        const result = scoreRun([{ round: r32, pick: home, actual: away }])
        expect(result.totalPoints).toBe(0)
        expect(result.perMatch[0]).toEqual({ basePoints: 0, correct: false })
    })

    it("treats an unpredicted match as a miss", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: r32, pick: undefined, actual: away },
            { round: r32, pick: away, actual: away },
        ]
        expect(scoreRun(run).totalPoints).toBe(2)
    })

    it("does not score pending matches", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: "SEMI_FINAL", pick: home, actual: undefined },
            { round: r32, pick: home, actual: home },
        ]
        const result = scoreRun(run)
        expect(result.totalPoints).toBe(2)
        expect(result.perMatch[1].correct).toBeUndefined()
    })

    it("sums multiple correct picks across rounds", () => {
        const run: RunMatch[] = [
            { round: r32, pick: home, actual: home },
            { round: r32, pick: home, actual: away },
            { round: r16, pick: away, actual: away },
        ]
        // 1 + 0 + 3 = 4
        expect(scoreRun(run).totalPoints).toBe(4)
    })
})
