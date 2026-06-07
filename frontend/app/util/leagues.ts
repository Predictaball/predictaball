import { LeagueKindEnum } from "@/client"

// Managed leagues are assigned automatically (the global league and the per-country
// leagues) — members can't manually join or leave them.
export function isManagedLeague(kind: LeagueKindEnum): boolean {
    return kind !== LeagueKindEnum.User
}
