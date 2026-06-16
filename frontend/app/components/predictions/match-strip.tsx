'use client'

import React, {useEffect, useRef} from "react"
import Link from "next/link"
import {Chip, Match, MatchStateEnum} from "@/client"
import {LocalTime} from "@/app/components/predictions/local-time"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {ACTION_PILL_BORDER} from "@/app/util/css-classes"
import {PointsPill} from "@/app/components/predictions/chip-impact"
import {PredictionRatePill} from "@/app/components/points/streak-badges"
import type {StreakStats} from "@/app/util/streaks"

// Power-ups worth surfacing on the pill. Crowd has its own "? - ?" treatment.
const CHIP_GLYPH: Partial<Record<Chip, string>> = {
    [Chip.DoublePoints]: "2×",
    [Chip.OneGoalOut]: "±1",
}

const PILL_BORDER = "bg-slate-900/10 hover:bg-slate-900/20 dark:bg-white/10 dark:hover:bg-white/20"

interface MatchStripProps {
    liveMatches: Match[]
    upcomingMatches: Match[]
    /** The most recent completed matches (already trimmed to the few we show). */
    completedMatches: Match[]
    /** Where the "View all" pill in the Completed row points. */
    historyHref: string
    selectedId: string
    onSelect: (id: string) => void
    /** Drives the prediction-rate pill in the Completed row header. */
    streaks: StreakStats
}

export default function MatchStrip({liveMatches, upcomingMatches, completedMatches, historyHref, selectedId, onSelect, streaks}: MatchStripProps) {
    return (
        <div className="space-y-4">
            {liveMatches.length > 0 && (
                <LinkRow title="Live" matches={liveMatches} live/>
            )}
            {upcomingMatches.length > 0 && (
                <StripRow title="Upcoming" matches={upcomingMatches} selectedId={selectedId} onSelect={onSelect}/>
            )}
            {completedMatches.length > 0 && (
                <CompletedRow matches={completedMatches} historyHref={historyHref} streaks={streaks}/>
            )}
        </div>
    )
}

// Pills that link out to the match's predictions page rather than selecting
// the card on this page. Used for live matches (predictions locked, but you
// can see what others picked) — completed matches use their own row with the
// trailing "View all" pill.
function LinkRow({title, matches, live}: {title: string; matches: Match[]; live?: boolean}) {
    return (
        <div>
            <RowHeader title={title} live={live}/>
            <div
                className="flex gap-3 overflow-x-auto pb-2 px-4 sm:px-6 snap-x snap-mandatory scrollbar-thin"
                style={{scrollbarWidth: "thin"}}
            >
                {matches.map(m => (
                    <Link
                        key={m.matchId}
                        href={`/app/match/${m.matchId}/predictions`}
                        className={`snap-center shrink-0 rounded-2xl p-[1.5px] transition-transform hover:scale-[1.02] ${PILL_BORDER}`}
                    >
                        <PillBody match={m}/>
                    </Link>
                ))}
            </div>
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
            <RowHeader title={title} live={live}/>
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

// Completed matches aren't predictable, so their pills link out to the match's
// result/predictions page (like the history cards) rather than selecting into
// the card above. The trailing "View all" pill opens the full history.
function CompletedRow({matches, historyHref, streaks}: {matches: Match[]; historyHref: string; streaks: StreakStats}) {
    return (
        <div>
            <RowHeader title="Completed" action={<PredictionRatePill stats={streaks}/>}/>
            <div
                className="flex gap-3 overflow-x-auto pb-2 px-4 sm:px-6 snap-x snap-mandatory scrollbar-thin"
                style={{scrollbarWidth: "thin"}}
            >
                {matches.map(m => (
                    <Link
                        key={m.matchId}
                        href={`/app/match/${m.matchId}/predictions`}
                        className={`snap-center shrink-0 rounded-2xl p-[1.5px] transition-transform hover:scale-[1.02] ${PILL_BORDER}`}
                    >
                        <PillBody match={m}/>
                    </Link>
                ))}
                <Link
                    href={historyHref}
                    className={`snap-center shrink-0 rounded-2xl p-[1.5px] transition-transform hover:scale-[1.02] ${PILL_BORDER}`}
                >
                    <div className="h-full rounded-2xl bg-white dark:bg-gray-900/90 px-6 flex flex-col items-center justify-center gap-0.5 min-w-[120px] text-center">
                        <span className="text-sm font-bold text-cyan-600 dark:text-cyan-300">View all →</span>
                        <span className="text-[11px] text-slate-400 dark:text-gray-500">Past matches</span>
                    </div>
                </Link>
            </div>
        </div>
    )
}

function RowHeader({title, live, action}: {title: string; live?: boolean; action?: React.ReactNode}) {
    return (
        <div className="flex items-center gap-2 mb-2 px-4 sm:px-6">
            {live && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>}
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">{title}</h3>
            {action && <div className="ml-auto">{action}</div>}
        </div>
    )
}

const MatchPill = React.forwardRef<HTMLButtonElement, {match: Match; selected: boolean; onSelect: () => void}>(
    function MatchPill({match, selected, onSelect}, ref) {
    const needsPrediction = match.state === MatchStateEnum.Upcoming && !match.prediction

    return (
        <button
            ref={ref}
            type="button"
            onClick={onSelect}
            className={`snap-center shrink-0 rounded-2xl p-[1.5px] transition-transform ${
                selected
                    ? "bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 scale-[1.02]"
                    : needsPrediction
                        ? ACTION_PILL_BORDER
                        : PILL_BORDER
            }`}
        >
            <PillBody match={match}/>
        </button>
    )
})

// Shared inner content for every pill (selectable or link). Shows the teams with
// the result (completed) or "vs", then the kickoff time and the user's
// prediction — with their live/final points once the match has a score.
function PillBody({match}: {match: Match}): React.JSX.Element {
    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()
    const predicted = match.prediction
    const isCompleted = match.state === MatchStateEnum.Completed
    const hasScore = match.homeScore !== undefined && match.awayScore !== undefined
    // Follow-the-Crowd predictions are only locked in at kickoff, so the user's
    // stored score is a placeholder until the match starts — show ?-? until then.
    const crowdPending = predicted?.chip === Chip.Crowd && match.state === MatchStateEnum.Upcoming
    const needsPrediction = match.state === MatchStateEnum.Upcoming && !predicted
    const chipGlyph = predicted ? CHIP_GLYPH[predicted.chip] : undefined

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-900/90 px-4 py-3 min-w-[200px] text-left">
            <div className="flex items-center justify-between gap-3">
                <PillFlag code={homeCode} name={match.homeTeam}/>
                {isCompleted && hasScore ? (
                    <span className="text-sm font-black tabular-nums text-slate-700 dark:text-gray-200">{match.homeScore} - {match.awayScore}</span>
                ) : (
                    <span className="text-xs font-semibold text-slate-400 dark:text-gray-500">vs</span>
                )}
                <PillFlag code={awayCode} name={match.awayTeam}/>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
                <div className="text-slate-500 dark:text-gray-500">
                    <LocalTime date={match.datetime}/>
                </div>
                {predicted ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-cyan-600 dark:text-cyan-300">
                        {chipGlyph && (
                            <span className="rounded border border-cyan-500/30 bg-cyan-500/15 px-1 py-0.5 text-[9px] font-black leading-none tabular-nums text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-300">
                                {chipGlyph}
                            </span>
                        )}
                        {crowdPending ? "? - ?" : `${predicted.homeScore} - ${predicted.awayScore}`}
                        {predicted.points !== undefined
                            ? <PointsPill points={predicted.points} className="h-5 px-2 text-[10px]"/>
                            : <CheckIcon/>}
                    </span>
                ) : needsPrediction ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"/>
                        Predict
                    </span>
                ) : (
                    <span className="text-slate-400 dark:text-gray-500">No prediction</span>
                )}
            </div>
        </div>
    )
}

function CheckIcon(): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
            <path d="M20 6 9 17l-5-5"/>
        </svg>
    )
}

function PillFlag({code, name}: {code: string; name: string}) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            <FlagImage code={code} name={name} size={24}/>
            <span className="text-xs font-bold text-slate-700 dark:text-gray-200 truncate">{name}</span>
        </div>
    )
}
