import React, { Suspense } from "react";
import Entries from "@/app/components/leaderboard/entries";
import LeaderboardSkeleton from "@/app/components/leaderboard/leaderboard-skeleton";

interface LeaderboardProps {
    leagueId: string,
    limit: boolean,
    shouldPaginate: boolean
}

export default function Leaderboard(props: LeaderboardProps): React.JSX.Element {
    return (
        <div className="w-full mx-auto flex flex-col items-center">
            <Suspense fallback={<LeaderboardSkeleton />}>
                <Entries shouldPaginate={props.shouldPaginate} leagueId={props.leagueId} limit={props.limit} />
            </Suspense>
        </div>
    )
}
