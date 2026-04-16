'use client'

import React, {useMemo, useState} from "react"
import {Match, MatchRoundEnum, MatchStateEnum} from "@/client"
import FocusedGlobeClient from "@/app/components/flags/focused-globe-client"
import PredictionForm from "@/app/components/predictions/prediction-form"
import MatchStrip from "@/app/components/predictions/match-strip"

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
}

export default function PredictionPanel({liveMatches, upcomingMatches}: PredictionPanelProps): React.JSX.Element {
    const allMatches = useMemo(() => [...liveMatches, ...upcomingMatches], [liveMatches, upcomingMatches])
    const [selectedId, setSelectedId] = useState<string | undefined>(allMatches[0]?.matchId)
    const selected = allMatches.find(m => m.matchId === selectedId) ?? allMatches[0]

    if (!selected) {
        return (
            <div className="w-full max-w-5xl mx-auto my-10 rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-gray-300">
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
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="relative rounded-3xl bg-gradient-to-br from-white/15 to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
                <div className="relative rounded-3xl bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-[62%] aspect-square md:aspect-auto md:min-h-[480px] bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
                            <div className="absolute inset-0">
                                <FocusedGlobeClient homeCode={homeCode} awayCode={awayCode}/>
                            </div>
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                                <span className="inline-flex items-center gap-2 rounded-full bg-black/50 border border-white/10 px-3 py-1 text-xs font-semibold text-gray-200 backdrop-blur">
                                    {selected.state === MatchStateEnum.Live && (
                                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>
                                    )}
                                    {selected.state === MatchStateEnum.Live ? "Live" : ROUND_LABEL[selected.round]}
                                </span>
                                <span className="hidden sm:inline rounded-full bg-black/50 border border-white/10 px-3 py-1 text-xs text-gray-300 backdrop-blur">
                                    {selected.venue}
                                </span>
                            </div>
                        </div>
                        <PredictionForm match={selected} key={selected.matchId} onPredictionSaved={advanceToNext}/>
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
