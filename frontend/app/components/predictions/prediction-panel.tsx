'use client'

import React, {useEffect, useMemo, useState} from "react"
import {useRouter} from "next/navigation"
import {Match, MatchRoundEnum, MatchStateEnum} from "@/client"
import EmptyState from "@/app/components/empty-state"
import FocusedGlobeClient from "@/app/components/flags/focused-globe-client"
import PredictionForm from "@/app/components/predictions/prediction-form"
import MatchStrip from "@/app/components/predictions/match-strip"
import {MatchCountdown} from "@/app/components/predictions/match-countdown"
import {MatchScoreOverlay} from "@/app/components/predictions/match-score-overlay"
import {PointsPill} from "@/app/components/predictions/chip-impact"
import {useMatchSelection} from "@/app/components/predictions/match-selection"
import {KNOCKOUT_EXPLAINER_HREF, hasSeenKnockoutExplainer, needsKnockoutExplainer} from "@/app/components/predictions/knockout-explainer"
import type {UserChips} from "@/app/components/predictions/get-user-chips"
import type {StreakStats} from "@/app/util/streaks"
import SurfaceCard from "@/app/components/surface-card"
import {GLASS_PILL, GLASS_PILL_BOLD} from "@/app/util/css-classes"

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_THIRTY_TWO: "Round of 32",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
    THIRD_PLACE_PLAYOFF: "Third-Place Playoff",
    FINAL: "Final",
}

interface PredictionPanelProps {
    liveMatches: Match[]
    upcomingMatches: Match[]
    completedMatches: Match[]
    historyHref: string
    userChips: UserChips
    streaks: StreakStats
}

export default function PredictionPanel({liveMatches, upcomingMatches, completedMatches, historyHref, userChips, streaks}: PredictionPanelProps): React.JSX.Element {
    const router = useRouter()
    const allMatches = useMemo(() => [...liveMatches, ...upcomingMatches], [liveMatches, upcomingMatches])
    const {selectedId, setSelectedId} = useMatchSelection()
    const [chips, setChips] = useState<UserChips>(userChips)
    const [status, setStatus] = useState<{saved: boolean; hasChanges: boolean}>({saved: false, hasChanges: true})
    const selected = allMatches.find(m => m.matchId === selectedId) ?? allMatches[0]

    // The first time a user lands on a knockout match they still need to predict,
    // send them through a one-off explainer covering how knockout predictions
    // differ (no draws, pick who goes through). Returns them here afterwards.
    useEffect(() => {
        if (!selected) return
        if (!needsKnockoutExplainer(selected)) return
        if (hasSeenKnockoutExplainer()) return
        const next = "/app"
        router.push(`${KNOCKOUT_EXPLAINER_HREF}?next=${encodeURIComponent(next)}`)
    }, [selected, router])

    // Reset the status when switching matches so the badge never shows the
    // previous match's state before the (remounted) form reports its own.
    useEffect(() => {
        if (!selected) return
        setStatus({saved: selected.prediction !== undefined, hasChanges: selected.prediction === undefined})
    }, [selected?.matchId, selected?.prediction])

    // When there are no live or upcoming games we still want to show the
    // Completed strip below (recent results are useful the morning after a
    // match day and after the tournament ends). If there's nothing at all —
    // no live, no upcoming, no completed — fall back to the empty state.
    if (!selected) {
        if (completedMatches.length === 0) {
            return (
                <EmptyState className="w-full max-w-5xl mx-auto my-10" contentClassName="p-8 text-slate-600 dark:text-gray-300">
                    No matches available right now. Check back soon.
                </EmptyState>
            )
        }
        return (
            <div className="w-full space-y-6">
                <MatchStrip
                    liveMatches={liveMatches}
                    upcomingMatches={upcomingMatches}
                    completedMatches={completedMatches}
                    historyHref={historyHref}
                    selectedId=""
                    onSelect={setSelectedId}
                    streaks={streaks}
                />
            </div>
        )
    }

    function advanceToNext() {
        // Step to the next upcoming match in kickoff order so saving walks the
        // user through the whole list one at a time — including matches they've
        // already predicted, so nothing gets skipped. The backend returns
        // upcoming matches sorted by kickoff, so array order is kickoff order.
        const idx = upcomingMatches.findIndex(m => m.matchId === selected.matchId)
        if (idx !== -1 && idx + 1 < upcomingMatches.length) {
            setSelectedId(upcomingMatches[idx + 1].matchId)
            return
        }
        // Past the last upcoming match (or the saved match isn't upcoming): drop
        // to a live match if one's in play, otherwise stay put rather than
        // wrapping back to the start.
        const live = liveMatches[0]
        if (live && live.matchId !== selected.matchId) {
            setSelectedId(live.matchId)
        }
    }

    const homeCode = selected.homeTeamFlagCode.toLowerCase()
    const awayCode = selected.awayTeamFlagCode.toLowerCase()

    return (
        <div className="w-full space-y-6">
            <div className="max-w-5xl mx-auto">
                <SurfaceCard solid innerClassName="relative backdrop-blur-xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        <GlobeSection match={selected} status={status}>
                            <FocusedGlobeClient homeCode={homeCode} awayCode={awayCode} venue={selected.venue}/>
                        </GlobeSection>
                        <PredictionForm
                            match={selected}
                            key={selected.matchId}
                            onPredictionSaved={advanceToNext}
                            userChips={chips}
                            onChipsChanged={setChips}
                            onStatusChange={setStatus}
                        />
                    </div>
                </SurfaceCard>
            </div>
            <MatchStrip
                liveMatches={liveMatches}
                upcomingMatches={upcomingMatches}
                completedMatches={completedMatches}
                historyHref={historyHref}
                selectedId={selected.matchId}
                onSelect={setSelectedId}
                streaks={streaks}
            />
        </div>
    )
}

// Left half of the prediction card — the globe with overlay pills.
function GlobeSection({
    match,
    status,
    children,
}: {
    match: Match
    status: {saved: boolean; hasChanges: boolean}
    children: React.ReactNode
}): React.JSX.Element {
    return (
        <div className="relative w-full md:w-[62%] aspect-square md:aspect-auto md:min-h-[480px] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
            <div className="absolute inset-0">{children}</div>
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                <span className={GLASS_PILL_BOLD}>
                    {ROUND_LABEL[match.round]}
                </span>
                {match.state === MatchStateEnum.Upcoming && (
                    <StatusBadge saved={status.saved} hasChanges={status.hasChanges}/>
                )}
                {match.state === MatchStateEnum.Live && match.prediction?.points !== undefined && (
                    <span className="rounded-full bg-white/80 border border-slate-200 dark:bg-black/50 dark:border-white/10 p-0.5 backdrop-blur">
                        <PointsPill points={match.prediction.points}/>
                    </span>
                )}
            </div>
            <div className={`absolute bottom-4 left-4 right-4 flex items-center pointer-events-none ${match.state === MatchStateEnum.Live ? "justify-center" : "justify-between"}`}>
                {match.state === MatchStateEnum.Live ? (
                    <MatchScoreOverlay match={match}/>
                ) : (
                    <span className={GLASS_PILL}>
                        <MatchCountdown match={match}/>
                    </span>
                )}
            </div>
        </div>
    )
}

// Globe overlay pill mirroring the round/countdown pills, but colour-coded:
// emerald when the prediction is locked in, amber when it still needs action.
function StatusBadge({saved, hasChanges}: {saved: boolean; hasChanges: boolean}): React.JSX.Element {
    const pillBase = "pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-white/80 border dark:bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur"

    if (saved && !hasChanges) {
        return (
            <span className={`${pillBase} border-emerald-500/30 text-emerald-600 dark:border-emerald-400/30 dark:text-emerald-300`}>
                <CheckIcon/>
                Saved
            </span>
        )
    }

    return (
        <span className={`${pillBase} border-amber-500/30 text-amber-600 dark:border-amber-400/30 dark:text-amber-300`}>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"/>
            {saved ? "Unsaved changes" : "Not predicted yet"}
        </span>
    )
}

function CheckIcon(): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
            <path d="M20 6 9 17l-5-5"/>
        </svg>
    )
}
