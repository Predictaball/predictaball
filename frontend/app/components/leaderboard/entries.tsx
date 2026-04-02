import React from "react";
import {GetLeagueLeaderboard200Response, LeagueApi} from "@/client";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {filterWithContext} from "@/app/util/array";
import {getUserId} from "@/app/auth/jtw-handler";
import LeaderboardPagination from "./leaderboard-pagination";

export interface EntriesProps {
    leagueId: string,
    limit: boolean,
    shouldPaginate: boolean
}

export default async function Entries(props: EntriesProps): Promise<React.JSX.Element> {

    const userId = getUserId()

    async function getLeaderboard(): Promise<GetLeagueLeaderboard200Response | undefined> {
        try {
            const leagueApi = new LeagueApi(await getConfigWithAuthHeader())
            return await leagueApi.getLeagueLeaderboard({leagueId: props.leagueId, pageSize: "200"})
        } catch (error) {
            return undefined
        }
    }

    const leaderboardData = await getLeaderboard()

    const leaderboard = async () => {
        if (leaderboardData === undefined) {
            return []
        }
        const wholeLeaderboard = leaderboardData?.leaderboard
        if (!props.limit) {
            return wholeLeaderboard
        }
        const leader = wholeLeaderboard[0]
        const elementsForLeaderboard = filterWithContext(
            wholeLeaderboard,
            (element) => element.user.userId === userId,
            4
        )
        return elementsForLeaderboard.find(x => x === leader) !== undefined
            ? elementsForLeaderboard
            : [leader].concat(elementsForLeaderboard)
    }

    return (
        <>
            <p className="pb-2 text-white text-l font-bold">{leaderboardData?.leagueName} Standings</p>
            <LeaderboardPagination shouldPaginate={props.shouldPaginate} leaderboardInners={await leaderboard()} userId={userId}/>
        </>
    )
}