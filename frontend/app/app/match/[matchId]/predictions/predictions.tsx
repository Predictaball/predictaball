'use client'

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import {League, Match, MatchRoundEnum, MatchStateEnum, PredictionWithUser} from "@/client";
import PredictionData from "@/app/app/match/[matchId]/predictions/prediction";
import {Select, SelectItem} from "@nextui-org/react"
import Pagination from "@/app/components/pagination"
import BackButton from "@/app/components/back-button"
import useWindowDimensions from "@/app/hooks/use-window-dimension";
import {GLASS_PILL, GLASS_PILL_BOLD, SECTION_EYEBROW} from "@/app/util/css-classes";
import FocusedGlobeClient from "@/app/components/flags/focused-globe-client";
import {LocalTime} from "@/app/components/predictions/local-time";
import {MatchScoreOverlay} from "@/app/components/predictions/match-score-overlay";
import DistributionBar from "@/app/components/predictions/distribution-bar";
import PageShell from "@/app/components/page-shell";
import SurfaceCard from "@/app/components/surface-card";
import Wordmark from "@/app/components/wordmark";

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_THIRTY_TWO: "Round of 32",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
    THIRD_PLACE_PLAYOFF: "Third-Place Playoff",
    FINAL: "Final",
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
    const showDistribution = match.state !== MatchStateEnum.Upcoming && match.predictionDistribution !== undefined

    return (
        <SurfaceCard solid innerClassName="relative backdrop-blur-xl overflow-hidden">
            <div className="relative w-full aspect-square sm:aspect-[16/10] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
                <div className="absolute inset-0">
                    <FocusedGlobeClient homeCode={homeCode} awayCode={awayCode} venue={match.venue}/>
                </div>
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    {live ? (
                        <span aria-hidden/>
                    ) : (
                        <span className={GLASS_PILL_BOLD}>
                            {ROUND_LABEL[match.round]}
                        </span>
                    )}
                    <span className={GLASS_PILL}>
                        <LocalTime date={match.datetime}/>
                    </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
                    <MatchScoreOverlay match={match}/>
                </div>
            </div>
            {showDistribution && (
                // The bar's own component adds mt-4 internally; cancel it
                // with -mt-4 so the panel padding lands cleanly.
                <div className="border-t border-slate-200/70 dark:border-white/5 px-4 sm:px-5 pt-3 pb-4">
                    <div className="-mt-4">
                        <DistributionBar distribution={match.predictionDistribution!} homeName={match.homeTeam} awayName={match.awayTeam}/>
                    </div>
                </div>
            )}
        </SurfaceCard>
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
        <PageShell svh>
            <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <header className="relative flex items-center justify-between">
                    <BackButton/>
                    <Wordmark className="hidden sm:flex absolute left-1/2 -translate-x-1/2"/>
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
                                match={props.match}
                                position={currentPage * itemsPerPage + index + 1}
                                isUser={predictionWithUser.user.userId === props.currentUserId}
                            />
                        ))}
                    </div>
                    {totalPages > 1 &&
                        <div className="flex justify-center pt-2">
                            <Pagination page={currentPage + 1} total={totalPages} onChange={handlePageChange}/>
                        </div>}
                </section>
            </div>
        </PageShell>
    )
}
