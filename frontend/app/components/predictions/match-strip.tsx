'use client'

import React, {useEffect, useRef} from "react"
import {Match} from "@/client"
import {LocalTime} from "@/app/components/ticket/local-time"
import {FlagImage} from "@/app/components/predictions/flag-image"

interface MatchStripProps {
    liveMatches: Match[]
    upcomingMatches: Match[]
    selectedId: string
    onSelect: (id: string) => void
}

export default function MatchStrip({liveMatches, upcomingMatches, selectedId, onSelect}: MatchStripProps) {
    return (
        <div className="space-y-4">
            {liveMatches.length > 0 && (
                <StripRow title="Live" matches={liveMatches} selectedId={selectedId} onSelect={onSelect} live/>
            )}
            {upcomingMatches.length > 0 && (
                <StripRow title="Upcoming" matches={upcomingMatches} selectedId={selectedId} onSelect={onSelect}/>
            )}
        </div>
    )
}

function StripRow({title, matches, selectedId, onSelect, live}: {
    title: string
    matches: Match[]
    selectedId: string
    onSelect: (id: string) => void
    live?: boolean
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const selectedRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const el = selectedRef.current
        const container = scrollRef.current
        if (!el || !container) return
        const scrollTarget = el.offsetLeft - (container.offsetWidth - el.offsetWidth) / 2
        container.scrollTo({left: scrollTarget, behavior: "smooth"})
    }, [selectedId])

    return (
        <div>
            <div className="flex items-center gap-2 mb-2 px-4 sm:px-6">
                {live && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>}
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">{title}</h3>
            </div>
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-2 px-4 sm:px-6 snap-x snap-mandatory scrollbar-thin"
                style={{scrollbarWidth: "thin"}}
            >
                {matches.map(m => (
                    <MatchPill
                        key={m.matchId}
                        ref={m.matchId === selectedId ? selectedRef : undefined}
                        match={m}
                        selected={m.matchId === selectedId}
                        onSelect={() => onSelect(m.matchId)}
                    />
                ))}
            </div>
        </div>
    )
}

const MatchPill = React.forwardRef<HTMLButtonElement, {match: Match; selected: boolean; onSelect: () => void}>(
    function MatchPill({match, selected, onSelect}, ref) {
    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()
    const predicted = match.prediction

    return (
        <button
            ref={ref}
            type="button"
            onClick={onSelect}
            className={`snap-center shrink-0 rounded-2xl p-[1.5px] transition-transform ${
                selected
                    ? "bg-gradient-to-br from-blue-500 via-cyan-400 to-green-300 scale-[1.02]"
                    : "bg-slate-900/10 hover:bg-slate-900/20 dark:bg-white/10 dark:hover:bg-white/20"
            }`}
        >
            <div className="rounded-2xl bg-white dark:bg-gray-900/90 px-4 py-3 min-w-[200px] text-left">
                <div className="flex items-center justify-between gap-3">
                    <PillFlag code={homeCode} name={match.homeTeam}/>
                    <span className="text-xs font-semibold text-slate-400 dark:text-gray-500">vs</span>
                    <PillFlag code={awayCode} name={match.awayTeam}/>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                    <div className="text-slate-500 dark:text-gray-500">
                        <LocalTime date={match.datetime}/>
                    </div>
                    {predicted ? (
                        <span className="font-bold text-cyan-600 dark:text-cyan-300">{predicted.homeScore} - {predicted.awayScore}</span>
                    ) : (
                        <span className="text-slate-400 dark:text-gray-500">No prediction</span>
                    )}
                </div>
            </div>
        </button>
    )
})

function PillFlag({code, name}: {code: string; name: string}) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            <FlagImage code={code} name={name} size={24}/>
            <span className="text-xs font-bold text-slate-700 dark:text-gray-200 truncate">{name}</span>
        </div>
    )
}
