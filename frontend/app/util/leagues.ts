import { LeagueKindEnum } from "@/client"

// Managed leagues are assigned automatically (the global league and the per-country
// leagues) — members can't manually join or leave them.
export function isManagedLeague(kind: LeagueKindEnum): boolean {
    return kind !== LeagueKindEnum.User
}

// The canonical invite link for a league. New users can sign up straight from it,
// and it's the same URL we encode into the scannable QR code.
export function inviteUrl(leagueId: string): string {
    return `https://www.predictaball.live/league/${leagueId}/join`
}

// The country league ID is the slugified team name (e.g. "South Africa" ->
// "south-africa"), matching how the backend derives it when auto-creating the
// per-country leagues. Used to link a country ranking entry to its league.
export function countryLeagueId(teamName: string): string {
    return teamName.toLowerCase().replace(/\s+/g, "-")
}
