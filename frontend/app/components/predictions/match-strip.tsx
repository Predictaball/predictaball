'use client'

import React, {useRef} from "react"
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
    return (
        <div>
            <div className="flex items-center gap-2 mb-2 px-1">
                {live && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>}
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">{title}</h3>
            </div>
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin"
                style={{scrollbarWidth: "thin"}}
            >
                {matches.map(m => (
                    <MatchPill key={m.matchId} match={m} selected={m.matchId === selectedId} onSelect={() => onSelect(m.matchId)}/>
                ))}
            </div>
        </div>
    )
}

function MatchPill({match, selected, onSelect}: {match: Match; selected: boolean; onSelect: () => void}) {
    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()
    const predicted = match.prediction

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`snap-start shrink-0 rounded-2xl p-[1.5px] transition-transform ${
                selected
                    ? "bg-gradient-to-br from-blue-500 via-cyan-400 to-green-300 scale-[1.02]"
                    : "bg-white/10 hover:bg-white/20"
            }`}
        >
            <div className="rounded-2xl bg-gray-900/90 px-4 py-3 min-w-[200px] text-left">
                <div className="flex items-center justify-between gap-3">
                    <PillFlag code={homeCode} name={match.homeTeam}/>
                    <span className="text-xs font-semibold text-gray-500">vs</span>
                    <PillFlag code={awayCode} name={match.awayTeam}/>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                    <div className="text-gray-500">
                        <LocalTime date={match.datetime}/>
                    </div>
                    {predicted ? (
                        <span className="font-bold text-cyan-300">{predicted.homeScore} - {predicted.awayScore}</span>
                    ) : (
                        <span className="text-gray-500">No prediction</span>
                    )}
                </div>
            </div>
        </button>
    )
}

function PillFlag({code, name}: {code: string; name: string}) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            <FlagImage code={code} name={name} size={24}/>
            <span className="text-xs font-bold text-gray-200 truncate">{name}</span>
        </div>
    )
}
