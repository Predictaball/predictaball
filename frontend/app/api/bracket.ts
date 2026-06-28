import { getConfigWithAuthHeader } from "@/app/api/client-config"
import { Bracket, BracketApi, GetBracketLeaderboard200Response } from "@/client"

// Server-side helpers for the Knockout Cup endpoints. Both resolve to null on
// failure so pages can degrade gracefully (mirrors the league pages' .catch).

export async function getBracket(): Promise<Bracket | null> {
    return new BracketApi(await getConfigWithAuthHeader()).getBracket().catch(() => null)
}

export async function getBracketLeaderboard(leagueId: string): Promise<GetBracketLeaderboard200Response | null> {
    return new BracketApi(await getConfigWithAuthHeader())
        .getBracketLeaderboard({ leagueId })
        .catch(() => null)
}
