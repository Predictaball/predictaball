import {Match, MatchStateEnum} from "@/client"

export interface Streaks {
    // Consecutive most-recent completed matches the user submitted a prediction for.
    prediction: number
    // Consecutive most-recent completed matches the user scored points on.
    points: number
}

// Derive "current" streaks from a user's matches. Both streaks are measured
// backwards from the most recently played match and broken by the first gap:
//   - prediction streak breaks on the first completed match with no prediction
//   - points streak breaks on the first completed match that scored 0 (or had
//     no prediction)
// Only COMPLETED matches count — live/upcoming games have no final points yet,
// so they neither extend nor break a streak.
export function computeStreaks(matches: Match[]): Streaks {
    const completed = matches
        .filter(m => m.state === MatchStateEnum.Completed)
        .sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())

    let prediction = 0
    for (const match of completed) {
        if (!match.prediction) break
        prediction++
    }

    let points = 0
    for (const match of completed) {
        if (!match.prediction || (match.prediction.points ?? 0) <= 0) break
        points++
    }

    return {prediction, points}
}
