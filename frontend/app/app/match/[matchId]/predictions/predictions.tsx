'use client'

import React, {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {League, Match, MatchRoundEnum, MatchStateEnum, PredictionWithUser} from "@/client";
import PredictionData from "@/app/app/match/[matchId]/predictions/prediction";
import {Pagination, Select, SelectItem} from "@nextui-org/react"
import BackButton from "@/app/components/back-button"
import useWindowDimensions from "@/app/hooks/use-window-dimension";
import {BUTTON_CLASS, SECTION_EYEBROW} from "@/app/util/css-classes";
import FocusedGlobeClient from "@/app/components/flags/focused-globe-client";
import {FlagImage} from "@/app/components/predictions/flag-image";
import {LocalTime} from "@/app/components/predictions/local-time";
import {COUNTRY_CODES} from "@/app/util/teams";

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
    FINAL: "Final",
}

function teamLabel(team: string): string {
    return COUNTRY_CODES[team.toLowerCase()] ?? team
}

function GlobeIcon(): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500" aria-hidden>
            <circle cx="12" cy="12" r="9"/>
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
        </svg>
    )
}

function MatchGlobeHeader({match}: {match: Match}): React.JSX.Element {
    const live = match.state === MatchStateEnum.Live
    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()
    const hasScore = match.homeScore !== undefined && match.awayScore !== undefined

    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
            <div className="relative rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                <div className="relative w-full aspect-square sm:aspect-[16/10] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
                    <div className="absolute inset-0">
                        <FocusedGlobeClient homeCode={homeCode} awayCode={awayCode} venue={match.venue}/>
                    </div>
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 text-slate-700 dark:bg-black/50 dark:border-white/10 dark:text-gray-200 px-3 py-1 text-xs font-semibold backdrop-blur">
                            {live && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>}
                            {live ? "Live" : ROUND_LABEL[match.round]}
                        </span>
                        <span className="rounded-full bg-white/80 border border-slate-200 text-slate-600 dark:bg-black/50 dark:border-white/10 dark:text-gray-300 px-3 py-1 text-xs backdrop-blur">
                            <LocalTime date={match.datetime}/>
                        </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
                        <div className="flex items-center gap-2.5 rounded-full bg-white/80 border border-slate-200 dark:bg-black/50 dark:border-white/10 px-3.5 py-1.5 backdrop-blur">
                            <FlagImage code={homeCode} name={match.homeTeam} size={24}/>
                            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{teamLabel(match.homeTeam)}</span>
                            <span className="px-1 text-lg font-black tabular-nums text-slate-900 dark:text-white">
                                {hasScore ? `${match.homeScore} - ${match.awayScore}` : "vs"}
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{teamLabel(match.awayTeam)}</span>
                            <FlagImage code={awayCode} name={match.awayTeam} size={24}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Predictions(
    props: {
        leagueId: string,
        matchId: string,
        leagues: League[],
        match: Match,
        predictions: PredictionWithUser[],
        currentUserId?: string
    }
): React.JSX.Element {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(0)
    const windowsSize = useWindowDimensions()
    const itemsPerPage = windowsSize.height !== undefined ? Math.max((Math.round(windowsSize.height / 80)) - 5, 1) : 5

    const getPaginatedPredictions = (leaderboard: PredictionWithUser[]) => {
        const startIndex = currentPage * itemsPerPage;
        return leaderboard.slice(startIndex, startIndex + itemsPerPage);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page - 1);
    };

    const totalPages = Math.ceil(props.predictions.length / itemsPerPage);

    // Ensure the active filter always has a matching option, otherwise the
    // controlled Select renders an empty trigger (e.g. the default "global").
    const leagueOptions: {leagueId: string; name: string}[] = props.leagues.map(l => ({leagueId: l.leagueId, name: l.name}))
    if (!leagueOptions.some(o => o.leagueId === props.leagueId)) {
        leagueOptions.unshift({leagueId: props.leagueId, name: props.leagueId === "global" ? "Global" : "All predictions"})
    }

    return (
        <main className="relative min-h-dvh bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <header className="relative flex items-center justify-between">
                    <BackButton/>
                    <Link href="/" className="hidden sm:flex items-baseline font-black tracking-tight text-lg absolute left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">predicta</span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </Link>
                    <div className="w-10"/>
                </header>

                <MatchGlobeHeader match={props.match}/>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className={SECTION_EYEBROW}>Predictions</h2>
                        {leagueOptions.length > 0 && (
                            <Select
                                aria-label="Filter predictions by league"
                                size="sm"
                                radius="full"
                                disallowEmptySelection
                                selectedKeys={[props.leagueId]}
                                onSelectionChange={(keys) => {
                                    const next = Array.from(keys)[0]
                                    if (typeof next !== "string" || next === props.leagueId) return
                                    router.push(`/app/match/${props.matchId}/predictions?leagueId=${encodeURIComponent(next)}`)
                                }}
                                startContent={<GlobeIcon/>}
                                className="max-w-[12rem]"
                                classNames={{
                                    trigger: "h-9 min-h-9 bg-slate-900/5 border border-slate-900/10 hover:bg-slate-900/10 hover:border-cyan-500/40 data-[open=true]:border-cyan-500/40 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-cyan-400/40 shadow-none transition-colors",
                                    value: "text-sm font-semibold text-slate-700 dark:text-gray-200",
                                    selectorIcon: "text-slate-400 dark:text-gray-500",
                                    popoverContent: "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-xl",
                                }}
                            >
                                {leagueOptions.map(league => (
                                    <SelectItem
                                        key={league.leagueId}
                                        className="text-slate-700 dark:text-gray-200 data-[hover=true]:bg-slate-900/5 dark:data-[hover=true]:bg-white/10 data-[selectable=true]:focus:bg-slate-900/5 dark:data-[selectable=true]:focus:bg-white/10"
                                    >
                                        {league.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        )}
                    </div>
                    <div className="flex flex-col items-center">
                        {getPaginatedPredictions(props.predictions).map((predictionWithUser, index) => (
                            <PredictionData
                                key={predictionWithUser.user.userId}
                                predictionWithUser={predictionWithUser}
                                position={currentPage * itemsPerPage + index + 1}
                                isUser={predictionWithUser.user.userId === props.currentUserId}
                            />
                        ))}
                    </div>
                    {totalPages > 1 &&
                        <div className="flex justify-center pt-2">
                            <Pagination showControls radius="full" total={totalPages} initialPage={1}
                                        onChange={handlePageChange}
                                        classNames={{
                                            cursor: BUTTON_CLASS,
                                            item: "bg-transparent text-slate-700 dark:text-gray-200 hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors"
                                        }}
                            />
                        </div>}
                </section>
            </div>
        </main>
    )
}
