import {Match, MatchStateEnum} from "@/client"

export interface StreakStats {
    // Share (0..1) of completed matches the user submitted a prediction for.
    predictionRate: number
    // Completed matches the user predicted (numerator of the rate).
    predicted: number
    // Total completed matches played (denominator of the rate).
    played: number
    // Consecutive most-recent completed matches the user scored points on,
    // measured backwards from the latest game and broken by the first match
    // that scored 0 (or had no prediction).
    pointsStreak: number
}

// Derive a user's prediction rate and current points streak from their matches.
// Only COMPLETED matches count — live/upcoming games have no final points yet
// and their prediction window may still be open.
export function computeStreakStats(matches: Match[]): StreakStats {
    const completed = matches
        .filter(m => m.state === MatchStateEnum.Completed)
        .sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())

    const predicted = completed.filter(m => m.prediction).length
    const played = completed.length
    const predictionRate = played > 0 ? predicted / played : 0

    let pointsStreak = 0
    for (const match of completed) {
        if (!match.prediction || (match.prediction.points ?? 0) <= 0) break
        pointsStreak++
    }

    return {predictionRate, predicted, played, pointsStreak}
}
