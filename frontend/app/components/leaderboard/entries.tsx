import React from "react";
import {GetLeagueLeaderboard200Response, LeagueApi} from "@/client";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {filterWithContext} from "@/app/util/array";
import {getUserId} from "@/app/auth/jwt-handler";
import LeaderboardPagination from "./leaderboard-pagination";
import {getUserForm} from "@/app/components/leaderboard/get-user-form";

export interface EntriesProps {
    leagueId: string,
    limit: boolean,
    shouldPaginate: boolean
}

export default async function Entries(props: EntriesProps): Promise<React.JSX.Element> {

    const userId = await getUserId()

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

    const entries = await leaderboard()
    const formResults = await Promise.all(entries.map(e => getUserForm(e.user.userId)))
    const formByUserId: Record<string, (number | null)[]> = Object.fromEntries(
        entries.map((e, i) => [e.user.userId, formResults[i]])
    )

    return (
        <div className="w-full max-w-2xl mx-auto">
            {leaderboardData?.leagueName && (
                <p className="pb-3 text-center text-sm font-semibold tracking-wide text-slate-600 dark:text-gray-300">
                    {leaderboardData.leagueName}
                </p>
            )}
            <LeaderboardPagination
                shouldPaginate={props.shouldPaginate}
                leaderboardInners={entries}
                userId={userId}
                formByUserId={formByUserId}
            />
        </div>
    )
}
