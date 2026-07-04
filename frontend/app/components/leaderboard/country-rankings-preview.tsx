import React from "react";
import {CountryLeaderboardInner, LeagueApi} from "@/client";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {SHARED_DATA_REVALIDATE_SECONDS} from "@/app/api/constants";
import CountryRankingEntry from "@/app/components/leaderboard/country-ranking-entry";
import EmptyState from "@/app/components/empty-state";

interface CountryRankingsPreviewProps {
    limit?: number
}

export default async function CountryRankingsPreview({limit = 5}: CountryRankingsPreviewProps): Promise<React.JSX.Element> {
    const rankings: CountryLeaderboardInner[] = await new LeagueApi(await getConfigWithAuthHeader())
        .getCountryRankings({next: {revalidate: SHARED_DATA_REVALIDATE_SECONDS}})
        .then(response => response.rankings)
        .catch(() => [])

    if (rankings.length === 0) {
        return <EmptyState>No country scores yet — check back once matches have been played.</EmptyState>
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            {rankings.slice(0, limit).map(entry => (
                <CountryRankingEntry key={entry.teamId} entry={entry}/>
            ))}
        </div>
    )
}
