import { unstable_cache } from "next/cache"
import { GetLeagueLeaderboard200Response } from "@/client"
import { API_GATEWAY } from "@/app/api/constants"

async function fetchLeaderboard(leagueId: string, authToken: string): Promise<GetLeagueLeaderboard200Response | undefined> {
    try {
        const res = await fetch(`${API_GATEWAY}/league/${leagueId}/leaderboard?pageSize=200`, {
            headers: { "Authorization": authToken },
        })
        if (!res.ok) return undefined
        return await res.json()
    } catch {
        return undefined
    }
}

export const getCachedGlobalLeaderboard = (authToken: string) =>
    unstable_cache(
        () => fetchLeaderboard("global", authToken),
        ["global-leaderboard"],
        { revalidate: 60 }
    )()
