// Managed leagues are assigned automatically (the global league and the per-country
// leagues) — members can't manually join or leave them.
export function isManagedLeague(leagueId: string): boolean {
    return leagueId === "global" || leagueId.startsWith("country-")
}
