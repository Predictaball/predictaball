import {Match, MatchRoundEnum, Standings} from "@/client"

export const KNOCKOUT_GROUP = "Knockout"

// Matches don't carry a group letter, so we resolve it from the standings: both
// teams in a group-stage fixture share a group, so a team-name lookup places it.
export function buildTeamGroupMap(groups: Standings["groups"]): Map<string, string> {
    const teamGroup = new Map<string, string>()
    for (const g of groups) {
        for (const row of g.standings) teamGroup.set(row.teamName.toLowerCase(), g.group)
    }
    return teamGroup
}

export function resolveMatchGroup(match: Match, teamGroup: Map<string, string>): string {
    if (match.round !== MatchRoundEnum.GroupStage) return KNOCKOUT_GROUP
    return teamGroup.get(match.homeTeam.toLowerCase()) ?? teamGroup.get(match.awayTeam.toLowerCase()) ?? KNOCKOUT_GROUP
}

export function bucketMatchesByGroupLetter(groups: Standings["groups"], matches: Match[]): Record<string, Match[]> {
    const teamGroup = buildTeamGroupMap(groups)
    const byGroup: Record<string, Match[]> = {}
    for (const m of matches) {
        const key = resolveMatchGroup(m, teamGroup)
        ;(byGroup[key] ??= []).push(m)
    }
    return byGroup
}

export interface MatchDayGroup {
    key: string
    date: Date
    matches: Match[]
}

// Group matches into calendar-day buckets, most recent day first and matches
// within each day ordered latest-to-earliest.
export function groupMatchesByDay(matches: Match[]): MatchDayGroup[] {
    const byDay = new Map<string, Match[]>()
    for (const m of matches) {
        const d = m.datetime
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        ;(byDay.get(key) ?? byDay.set(key, []).get(key)!).push(m)
    }
    return [...byDay.entries()]
        .map(([key, dayMatches]) => {
            const sorted = [...dayMatches].sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())
            return {key, date: sorted[0].datetime, matches: sorted}
        })
        .sort((a, b) => b.date.valueOf() - a.date.valueOf())
}
