import React from "react";
import Link from "next/link";
import CountUpWrapped from "@/app/components/points/count-up-wrapper";
import { CountryLeaderboardInner, GetUserPoints200Response, LeagueApi, UserApi } from "@/client";
import { getConfigWithAuthHeader } from "@/app/api/client-config";
import { getUserId } from "@/app/auth/jwt-handler";
import { getPositionForLeague } from "@/app/app/league/get-position-for-league";
import { FlagImage } from "@/app/components/predictions/flag-image";
import { StreakPills, PILL, PILL_LABEL } from "@/app/components/points/streak-badges";
import { StreakStats } from "@/app/util/streaks";
import FormBadge from "@/app/components/leaderboard/form-badge";
import { getUserForm } from "@/app/components/leaderboard/get-user-form";

interface HeadlineProps {
    hasLiveMatch: boolean
    supportedTeamId?: string
    streaks: StreakStats
}

function ordinal(n: number): string {
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`
    switch (n % 10) {
        case 1: return `${n}st`
        case 2: return `${n}nd`
        case 3: return `${n}rd`
        default: return `${n}th`
    }
}

export default async function Headline({ hasLiveMatch, supportedTeamId, streaks }: HeadlineProps): Promise<React.JSX.Element> {

    const userId = await getUserId()
    const config = await getConfigWithAuthHeader()

    async function fetchUserData(): Promise<GetUserPoints200Response | undefined> {
        if (userId === undefined) {
            return undefined
        }
        try {
            const userApi = new UserApi(config)
            return await userApi.getUserPoints({ userId: userId })
        } catch (error) {
            console.log(error)
            return undefined
        }
    }

    async function fetchCountryRankings(): Promise<CountryLeaderboardInner[]> {
        try {
            return await new LeagueApi(config).getCountryRankings().then(response => response.rankings)
        } catch (error) {
            console.log(error)
            return []
        }
    }

    const [fetchedData, position, countryRankings, form] = await Promise.all([
        fetchUserData(),
        getPositionForLeague("global", config, userId),
        fetchCountryRankings(),
        userId ? getUserForm(userId) : Promise.resolve<(number | null)[]>([]),
    ])
    const total = (fetchedData?.fixedPoints || 0) + (fetchedData?.livePoints || 0)
    const live = fetchedData?.livePoints ?? 0
    // Show the user's country flanked by the country just above and just below
    // it in the rankings, so the pill reads as a country-vs-country ladder.
    const countryIndex = supportedTeamId ? countryRankings.findIndex(entry => entry.teamId === supportedTeamId) : -1
    const country = countryIndex >= 0 ? countryRankings[countryIndex] : undefined
    const countryNeighbours = country ? countryRankings.slice(Math.max(0, countryIndex - 1), countryIndex + 2) : []

    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/10 to-slate-900/[0.03] dark:from-white/10 dark:to-white/[0.03] p-[1px] shadow-xl shadow-cyan-500/5">
            <div className="rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-sm px-6 py-7 sm:py-10 text-center">
                <div className="text-5xl sm:text-7xl font-black leading-none tracking-tight">
                    <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                        <CountUpWrapped end={total} />
                    </span>
                </div>
                <div className="mt-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400">points</div>
                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap text-sm">
                    <span className={PILL}>
                        <span className="h-1 w-1 rounded-full bg-blue-400"/>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">#{position ?? "—"}</span>
                        <span className={PILL_LABEL}>global</span>
                    </span>
                    {country && (
                        <Link
                            href="/app/leaderboard/countries"
                            title={`${country.teamName} is ${ordinal(country.position)} of ${countryRankings.length} countries`}
                            className={`${PILL} transition-colors hover:bg-slate-900/[0.09] dark:hover:bg-white/[0.1]`}
                        >
                            {countryNeighbours.map(entry => {
                                const isUser = entry.teamId === supportedTeamId
                                return (
                                    <span key={entry.teamId} className={`inline-flex items-center gap-1.5 ${isUser ? "" : "opacity-50"}`}>
                                        <FlagImage code={entry.flagCode} name={entry.teamName} size={isUser ? 18 : 15}/>
                                        <span className={`tabular-nums ${isUser ? "font-black text-slate-900 dark:text-white" : "font-medium text-slate-500 dark:text-gray-400"}`}>
                                            {entry.position}
                                        </span>
                                    </span>
                                )
                            })}
                        </Link>
                    )}
                    {hasLiveMatch && (
                        <span className={PILL}>
                            <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse"/>
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">{live}</span>
                            <span className={PILL_LABEL}>live</span>
                        </span>
                    )}
                    <StreakPills stats={streaks} />
                    {form.length > 0 && (
                        <span className={PILL}>
                            <span className={PILL_LABEL}>form</span>
                            <FormBadge form={form} highlightLatest />
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
