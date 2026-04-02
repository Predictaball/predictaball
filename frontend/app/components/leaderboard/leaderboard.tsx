import React, { Suspense } from "react";
import { LeaderboardInnerMovementEnum, User } from "@/client";
import LeaderboardEntry from "./leaderboard-entry";
import Entries from "@/app/components/leaderboard/entries";
import { capitalizeFirstLetter } from "@/app/util/text";

interface LeaderboardProps {
    leagueId: string,
    limit: boolean,
    shouldPaginate: boolean
}

export default function Leaderboard(props: LeaderboardProps): React.JSX.Element {

    const defaultUser: User = {
        firstName: "Loading...",
        familyName: "",
        fixedPoints: 0,
        livePoints: 0,
        userId: ""
    }

    return (
        <div className="w-full p-5 text-center mx-auto flex flex-col items-center">
            <Suspense fallback={<LeaderboardEntry disablePulse entry={{ position: 1, movement: LeaderboardInnerMovementEnum.Unchanged, user: defaultUser }} isUser={false} />}>
                <Entries shouldPaginate={props.shouldPaginate} leagueId={props.leagueId} limit={props.limit} />
            </Suspense>
        </div>
    )
}