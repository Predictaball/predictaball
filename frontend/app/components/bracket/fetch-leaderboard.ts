'use server'

import { BracketApi, BracketLeaderboardRow } from "@/client"
import { getConfigWithAuthHeader } from "@/app/api/client-config"

// Server action used by the client-side league switcher so changing the
// Knockout Cup league re-fetches only the leaderboard rather than reloading
// the whole bracket page. Returns null on failure to match getBracketLeaderboard.
export async function fetchBracketLeaderboard(leagueId: string): Promise<BracketLeaderboardRow[] | null> {
    return new BracketApi(await getConfigWithAuthHeader())
        .getBracketLeaderboard({ leagueId })
        .then((response) => response.leaderboard)
        .catch(() => null)
}
