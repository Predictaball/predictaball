import {GroupStandingRow, Match, MatchRoundEnum, Standings} from "@/client"

interface Accumulator {
    teamId: string
    teamName: string
    flagCode: string
    group: string
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    points: number
}

function rankRows(accumulators: Accumulator[]): GroupStandingRow[] {
    return [...accumulators]
        .sort((a, b) =>
            b.points - a.points
            || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
            || b.goalsFor - a.goalsFor
            || a.teamName.localeCompare(b.teamName)
        )
        .map((a, index) => ({
            position: index + 1,
            teamId: a.teamId,
            teamName: a.teamName,
            flagCode: a.flagCode,
            group: a.group,
            played: a.played,
            won: a.won,
            drawn: a.drawn,
            lost: a.lost,
            goalsFor: a.goalsFor,
            goalsAgainst: a.goalsAgainst,
            goalDifference: a.goalsFor - a.goalsAgainst,
            points: a.points,
        }))
}

// Builds a per-group table from a user's own score predictions, using the
// same points/goal-difference rules as the real table but seeded from
// `match.prediction` instead of the actual result. Teams the user hasn't
// predicted yet still appear, with all-zero stats, since they come from the
// real standings' team list rather than from the predicted matches.
export function computePredictedStandings(groups: Standings["groups"], matches: Match[]): Record<string, GroupStandingRow[]> {
    const accumulators = new Map<string, Accumulator>()
    for (const g of groups) {
        for (const row of g.standings) {
            accumulators.set(row.teamName.toLowerCase(), {
                teamId: row.teamId,
                teamName: row.teamName,
                flagCode: row.flagCode,
                group: row.group,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0,
            })
        }
    }

    for (const match of matches) {
        if (match.round !== MatchRoundEnum.GroupStage) continue
        const prediction = match.prediction
        if (!prediction || prediction.homeScore == null || prediction.awayScore == null) continue

        const home = accumulators.get(match.homeTeam.toLowerCase())
        const away = accumulators.get(match.awayTeam.toLowerCase())
        if (!home || !away) continue

        const {homeScore, awayScore} = prediction
        home.played++
        away.played++
        home.goalsFor += homeScore
        home.goalsAgainst += awayScore
        away.goalsFor += awayScore
        away.goalsAgainst += homeScore

        if (homeScore > awayScore) {
            home.won++
            home.points += 3
            away.lost++
        } else if (homeScore < awayScore) {
            away.won++
            away.points += 3
            home.lost++
        } else {
            home.drawn++
            away.drawn++
            home.points++
            away.points++
        }
    }

    const byGroup: Record<string, Accumulator[]> = {}
    for (const acc of accumulators.values()) (byGroup[acc.group] ??= []).push(acc)

    const result: Record<string, GroupStandingRow[]> = {}
    for (const [group, accs] of Object.entries(byGroup)) result[group] = rankRows(accs)
    return result
}
