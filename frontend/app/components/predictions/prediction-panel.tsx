'use client'

import React, {useEffect, useMemo, useState} from "react"
import {Match, MatchRoundEnum, MatchStateEnum} from "@/client"
import FocusedGlobeClient from "@/app/components/flags/focused-globe-client"
import PredictionForm from "@/app/components/predictions/prediction-form"
import MatchStrip from "@/app/components/predictions/match-strip"
import {MatchCountdown} from "@/app/components/predictions/match-countdown"
import {MatchScoreOverlay} from "@/app/components/predictions/match-score-overlay"
import {useMatchSelection} from "@/app/components/predictions/match-selection"
import type {UserChips} from "@/app/components/predictions/get-user-chips"

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
    FINAL: "Final",
}

interface PredictionPanelProps {
    liveMatches: Match[]
    upcomingMatches: Match[]
    userChips: UserChips
}

export default function PredictionPanel({liveMatches, upcomingMatches, userChips}: PredictionPanelProps): React.JSX.Element {
    const allMatches = useMemo(() => [...liveMatches, ...upcomingMatches], [liveMatches, upcomingMatches])
    const {selectedId, setSelectedId} = useMatchSelection()
    const [chips, setChips] = useState<UserChips>(userChips)
    const [status, setStatus] = useState<{saved: boolean; hasChanges: boolean}>({saved: false, hasChanges: true})
    const selected = allMatches.find(m => m.matchId === selectedId) ?? allMatches[0]

    // Reset the status when switching matches so the badge never shows the
    // previous match's state before the (remounted) form reports its own.
    useEffect(() => {
        if (!selected) return
        setStatus({saved: selected.prediction !== undefined, hasChanges: selected.prediction === undefined})
    }, [selected?.matchId, selected?.prediction])

    if (!selected) {
        return (
            <div className="w-full max-w-5xl mx-auto my-10 rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 p-8 text-center text-slate-600 dark:text-gray-300">
                No matches available right now. Check back soon.
            </div>
        )
    }

    function advanceToNext() {
        const idx = allMatches.findIndex(m => m.matchId === selected.matchId)
        const next = allMatches[(idx + 1) % allMatches.length]
        if (next) setSelectedId(next.matchId)
    }

    const homeCode = selected.homeTeamFlagCode.toLowerCase()
    const awayCode = selected.awayTeamFlagCode.toLowerCase()

    return (
        <div className="w-full space-y-6">
            <div className="max-w-5xl mx-auto">
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
                    <div className="relative rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            <div className="relative w-full md:w-[62%] aspect-square md:aspect-auto md:min-h-[480px] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
                                <div className="absolute inset-0">
                                    <FocusedGlobeClient homeCode={homeCode} awayCode={awayCode} venue={selected.venue}/>
                                </div>
                                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 text-slate-700 dark:bg-black/50 dark:border-white/10 dark:text-gray-200 px-3 py-1 text-xs font-semibold backdrop-blur">
                                        {selected.state === MatchStateEnum.Live && (
                                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>
                                        )}
                                        {selected.state === MatchStateEnum.Live ? "Live" : ROUND_LABEL[selected.round]}
                                    </span>
                                    {selected.state === MatchStateEnum.Upcoming && (
                                        <StatusBadge saved={status.saved} hasChanges={status.hasChanges}/>
                                    )}
                                </div>
                                <div className={`absolute bottom-4 left-4 right-4 flex items-center pointer-events-none ${selected.state === MatchStateEnum.Live ? "justify-center" : "justify-between"}`}>
                                    {selected.state === MatchStateEnum.Live ? (
                                        <MatchScoreOverlay match={selected}/>
                                    ) : (
                                        <span className="rounded-full bg-white/80 border border-slate-200 text-slate-600 dark:bg-black/50 dark:border-white/10 dark:text-gray-300 px-3 py-1 text-xs backdrop-blur">
                                            <MatchCountdown match={selected}/>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <PredictionForm
                                match={selected}
                                key={selected.matchId}
                                onPredictionSaved={advanceToNext}
                                userChips={chips}
                                onChipsChanged={setChips}
                                onStatusChange={setStatus}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <MatchStrip
                liveMatches={liveMatches}
                upcomingMatches={upcomingMatches}
                selectedId={selected.matchId}
                onSelect={setSelectedId}
            />
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
