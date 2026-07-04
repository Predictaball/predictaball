import React from "react";
import {GetLeagueLeaderboard200Response, GetLeagueLeaderboardStageEnum, LeagueApi} from "@/client";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {filterWithContext} from "@/app/util/array";
import {getUserId} from "@/app/auth/jwt-handler";
import LeaderboardPagination from "./leaderboard-pagination";
import {getUserForm} from "@/app/components/leaderboard/get-user-form";
import {BRAND_GRADIENT} from "@/app/util/css-classes";

export interface EntriesProps {
    leagueId: string,
    limit: boolean,
    shouldPaginate: boolean,
    stage?: GetLeagueLeaderboardStageEnum,
    stageTabs?: React.ReactNode
}

function TrophyIcon({className}: {className?: string}): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
            <path d="M6 4h12v4a6 6 0 0 1-12 0V4Z"/>
            <path d="M6 6H4a2 2 0 0 0 0 4h2"/>
            <path d="M18 6h2a2 2 0 0 1 0 4h-2"/>
            <path d="M10 14.5V17m4-2.5V17"/>
            <path d="M8 21h8m-7-4h6l.5 4h-7l.5-4Z"/>
        </svg>
    )
}

export default async function Entries(props: EntriesProps): Promise<React.JSX.Element> {

    const userId = await getUserId()

    async function getLeaderboard(): Promise<GetLeagueLeaderboard200Response | undefined> {
        try {
            const leagueApi = new LeagueApi(await getConfigWithAuthHeader())
            return await leagueApi.getLeagueLeaderboard({leagueId: props.leagueId, pageSize: "200", stage: props.stage})
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
            2
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

    const playerCount = leaderboardData?.leaderboard.length ?? 0

    return (
        <div className="w-full max-w-2xl mx-auto">
            {leaderboardData?.leagueName && (
                props.limit ? (
                    <p className="pb-3 text-center text-sm font-semibold tracking-wide text-slate-600 dark:text-gray-300">
                        {leaderboardData.leagueName}
                    </p>
                ) : (
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${BRAND_GRADIENT} shadow-lg shadow-cyan-500/30`}>
                            <TrophyIcon className="h-8 w-8 text-white"/>
                        </div>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400">League</p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {leaderboardData.leagueName}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                            {playerCount} {playerCount === 1 ? "player" : "players"}
                        </p>
                    </div>
                )
            )}
            {props.stageTabs && (
                <div className="mb-6 flex justify-center">
                    {props.stageTabs}
                </div>
            )}
            <LeaderboardPagination
                shouldPaginate={props.shouldPaginate}
                limit={props.limit}
                leaderboardInners={entries}
                userId={userId}
                formByUserId={formByUserId}
            />
        </div>
    )
}
