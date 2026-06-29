import { LeagueKindEnum } from "@/client"

// Managed leagues are assigned automatically (the global league and the per-country
// leagues) — members can't manually join or leave them.
export function isManagedLeague(kind: LeagueKindEnum): boolean {
    return kind !== LeagueKindEnum.User
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
