import { League, LeagueKindEnum } from "@/client"

// Managed leagues are assigned automatically (the global league and the per-country
// leagues) — members can't manually join or leave them.
export function isManagedLeague(kind: LeagueKindEnum): boolean {
    return kind !== LeagueKindEnum.User
}

// The fixed display order for the tournament-wide standing leagues: Global first,
// then the two stage-scoped boards. Anything not listed here (the user's own
// leagues, then their country league) is ordered afterwards.
const STANDING_LEAGUE_ORDER = ["global", "group-stage", "knockout"]

function leagueSortRank(league: League): number {
    const fixedIndex = STANDING_LEAGUE_ORDER.indexOf(league.leagueId)
    if (fixedIndex !== -1) return fixedIndex
    // User-created leagues come next, with the auto-assigned country league last.
    return league.kind === LeagueKindEnum.User ? STANDING_LEAGUE_ORDER.length : STANDING_LEAGUE_ORDER.length + 1
}

// The tournament-wide standing leagues (Global, Group Stage, Knockout) that every
// member is auto-joined to. The Knockout Cup surfaces a single "Global" tab of its
// own, so callers building its league list use this to drop these from the user's
// leagues — both the duplicate Global and the stage-scoped boards.
export function isGlobalStandingLeague(leagueId: string): boolean {
    return STANDING_LEAGUE_ORDER.includes(leagueId)
}

// Order leagues for display: Global, Group Stage, Knockout, then the user's own
// leagues (alphabetically), then their country league.
export function sortLeagues(leagues: League[]): League[] {
    return [...leagues].sort((a, b) => leagueSortRank(a) - leagueSortRank(b) || a.name.localeCompare(b.name))
}

// Leagues that don't offer the stage filter (All / Group Stage / Knockout):
// the global league already shows every stage, and the "group-stage" and
// "knockout" leagues are themselves stage-scoped, so the tabs would be
// redundant on those pages.
const STAGE_FILTER_EXEMPT_LEAGUE_IDS = new Set(["global", "group-stage", "knockout"])

export function supportsStageFilter(leagueId: string): boolean {
    return !STAGE_FILTER_EXEMPT_LEAGUE_IDS.has(leagueId)
}

// The canonical invite link for a league. New users can sign up straight from it,
// and it's the same URL we encode into the scannable QR code.
export function inviteUrl(leagueId: string): string {
    return `https://www.predictaball.live/league/${leagueId}/join`
}
