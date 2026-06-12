import React from "react";
import {CountryLeaderboardInner, LeagueApi} from "@/client";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import CountryRankingEntry from "@/app/components/leaderboard/country-ranking-entry";

interface CountryRankingsPreviewProps {
    limit?: number
}

export default async function CountryRankingsPreview({limit = 5}: CountryRankingsPreviewProps): Promise<React.JSX.Element> {
    const rankings: CountryLeaderboardInner[] = await new LeagueApi(await getConfigWithAuthHeader())
        .getCountryRankings()
        .then(response => response.rankings)
        .catch(() => [])

    if (rankings.length === 0) {
        return (
            <div className="rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 px-4 py-6 text-center text-sm text-slate-500 dark:text-gray-400">
                No country scores yet — check back once matches have been played.
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            {rankings.slice(0, limit).map(entry => (
                <CountryRankingEntry key={entry.teamId} entry={entry}/>
            ))}
        </div>
    )
}
