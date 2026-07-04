import React from "react";
import Link from "next/link";
import CountUpWrapped from "@/app/components/points/count-up-wrapper";
import { CountryLeaderboardInner, GetUserPoints200Response, LeagueApi, UserApi } from "@/client";
import { getConfigWithAuthHeader } from "@/app/api/client-config";
import { SHARED_DATA_REVALIDATE_SECONDS } from "@/app/api/constants";
import { getUserId } from "@/app/auth/jwt-handler";
import { getPositionForLeague } from "@/app/app/league/get-position-for-league";
import { FlagImage } from "@/app/components/predictions/flag-image";
import { ScoringStreakPill } from "@/app/components/points/streak-badges";
import { StreakStats } from "@/app/util/streaks";
import FormBadge from "@/app/components/leaderboard/form-badge";
import { getUserForm } from "@/app/components/leaderboard/get-user-form";
import SurfaceCard from "@/app/components/surface-card";
import { BRAND_TEXT_GRADIENT, LIVE_DOT, TEXT_PRIMARY } from "@/app/util/css-classes";

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
            return await new LeagueApi(config).getCountryRankings({next: {revalidate: SHARED_DATA_REVALIDATE_SECONDS}}).then(response => response.rankings)
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
        <SurfaceCard solid innerClassName="backdrop-blur-sm px-6 py-7 sm:py-10 text-center">
            {/* The points total stays dead-centre; the live pill rides alongside
                it on the right without nudging the number off-centre. */}
            <div className="relative">
                <div className="text-5xl sm:text-7xl font-black leading-none tracking-tight">
                    <span className={BRAND_TEXT_GRADIENT}>
                        <CountUpWrapped end={total} />
                    </span>
                </div>
                {hasLiveMatch && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 px-3.5 py-1.5 text-sm">
                        <span className={LIVE_DOT}/>
                        <span className={`font-bold ${TEXT_PRIMARY} tabular-nums`}>{live}</span>
                        <span className="text-slate-500 dark:text-gray-400 text-[11px] uppercase tracking-[0.15em]">live</span>
                    </span>
                )}
            </div>
            <div className="mt-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400">points</div>
            <div className="mt-5 flex items-center justify-center gap-3 flex-wrap text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 px-3.5 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400"/>
                    <span className={`font-bold ${TEXT_PRIMARY} tabular-nums`}>#{position ?? "—"}</span>
                    <span className="text-slate-500 dark:text-gray-400 text-[11px] uppercase tracking-[0.15em]">global</span>
                </span>
                    {country && (
                        <Link
                            href="/app/leaderboard/countries"
                            title={`${country.teamName} is ${ordinal(country.position)} of ${countryRankings.length} countries`}
                            className="inline-flex items-center gap-2.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 px-3.5 py-1.5 transition-colors hover:border-cyan-500/40 dark:hover:border-cyan-400/40"
                        >
                            {countryNeighbours.map(entry => {
                                const isUser = entry.teamId === supportedTeamId
                                return (
                                    <span key={entry.teamId} className={`inline-flex items-center gap-1.5 ${isUser ? "" : "opacity-50"}`}>
                                        <FlagImage code={entry.flagCode} name={entry.teamName} size={isUser ? 20 : 16}/>
                                        <span className={`tabular-nums ${isUser ? "font-black text-slate-900 dark:text-white" : "font-medium text-slate-500 dark:text-gray-400"}`}>
                                            {entry.position}
                                        </span>
                                    </span>
                                )
                            })}
                        </Link>
                    )}
                    <ScoringStreakPill stats={streaks} />
                    {form.length > 0 && (
                        <span className="inline-flex items-center gap-2.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 px-3.5 py-1.5">
                            <span className="text-slate-500 dark:text-gray-400 text-[11px] uppercase tracking-[0.15em]">form</span>
                            <FormBadge form={form} highlightLatest />
                        </span>
                    )}
                </div>
        </SurfaceCard>
    )
}
