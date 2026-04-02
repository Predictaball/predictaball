import { failStyle, neutralStyle, successStyle } from "@/app/util/css-styles"

enum Result {
    SCORE, RESULT, NEITHER
}

export const RESULT_TO_STYLE: Map<Result, React.CSSProperties> = new Map([
    [Result.SCORE, successStyle],
    [Result.NEITHER, failStyle],
    [Result.RESULT, neutralStyle]
])

export function calculateResult(points: number): Result {
    if (points === 5) {
        return Result.SCORE
    }
    if (points === 2) {
        return Result.RESULT
    }
    return Result.NEITHER
}
