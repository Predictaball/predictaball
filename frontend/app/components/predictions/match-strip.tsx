'use client'

import React, {useEffect, useRef} from "react"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {Chip, Match, MatchStateEnum} from "@/client"
import {LocalTime} from "@/app/components/predictions/local-time"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {ACTION_PILL_BORDER, CHYRON_TAB} from "@/app/util/css-classes"
import {PointsPill} from "@/app/components/predictions/chip-impact"
import {PredictionRatePill} from "@/app/components/points/streak-badges"
import type {StreakStats} from "@/app/util/streaks"

// Power-ups worth surfacing on the pill. Crowd has its own "? - ?" treatment.
const CHIP_GLYPH: Partial<Record<Chip, string>> = {
    [Chip.DoublePoints]: "2×",
    [Chip.OneGoalOut]: "±1",
}

// Score-bug frames: solid opaque cards with a hard border. Selected gets the
// brand green, unpredicted matches get the amber "act now" edge.
const PILL_FRAME = "snap-center shrink-0 rounded-lg border-[1.5px] bg-white dark:bg-gray-900 transition-colors"
const PILL_BORDER = "border-slate-300 hover:border-slate-400 dark:border-white/15 dark:hover:border-white/30"
const PILL_BORDER_SELECTED = "border-pitch-600 dark:border-pitch-400"

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
                <StripRow title="Live" matches={liveMatches} selectedId={selectedId} onSelect={onSelect} live/>
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
                        className={`${PILL_FRAME} ${PILL_BORDER}`}
                    >
                        <PillBody match={m}/>
                    </Link>
                ))}
                <Link
                    href={historyHref}
                    className={`${PILL_FRAME} ${PILL_BORDER}`}
                >
                    <div className="h-full rounded-lg px-6 flex flex-col items-center justify-center gap-0.5 min-w-[120px] text-center">
                        <span className="text-sm font-bold text-pitch-700 dark:text-pitch-300">View all →</span>
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
            <h3 className={live ? LIVE_TAB : CHYRON_TAB}>
                {live && <span aria-hidden className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse"/>}
                {title}
            </h3>
            {action && <div className="ml-auto">{action}</div>}
        </div>
    )
}

// The live rows' tab swaps the chyron green for broadcast red.
const LIVE_TAB = "inline-flex items-center w-fit bg-red-600 text-white dark:bg-red-500 px-2.5 py-1 rounded-sm font-display text-sm font-bold uppercase tracking-[0.18em] leading-none"

// Clicking an unselected pill swaps the big card to that match. Clicking the
// already-selected one opens the dedicated predictions page — same gesture,
// context-dependent meaning. We keep the element type stable (always button)
// to avoid the mouseup landing on a different node after the re-render swap.
const MatchPill = React.forwardRef<HTMLButtonElement, {match: Match; selected: boolean; onSelect: () => void}>(
    function MatchPill({match, selected, onSelect}, ref) {
    const router = useRouter()
    const needsPrediction = match.state === MatchStateEnum.Upcoming && !match.prediction

    function handleClick() {
        // For live and completed matches a second click opens the dedicated
        // page (with crowd predictions, live updates, etc). Upcoming matches
        // have nothing extra to show there beyond what the prediction card on
        // this page already does, so we just no-op the second click.
        if (selected) {
            if (match.state !== MatchStateEnum.Upcoming) {
                router.push(`/app/match/${match.matchId}/predictions`)
            }
        } else {
            onSelect()
        }
    }

    return (
        <button
            ref={ref}
            type="button"
            onClick={handleClick}
            className={`${PILL_FRAME} ${
                selected
                    ? PILL_BORDER_SELECTED
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
    const isLive = match.state === MatchStateEnum.Live
    const hasScore = match.homeScore !== undefined && match.awayScore !== undefined
    // Follow-the-Crowd predictions are only locked in at kickoff, so the user's
    // stored score is a placeholder until the match starts — show ?-? until then.
    const crowdPending = predicted?.chip === Chip.Crowd && match.state === MatchStateEnum.Upcoming
    const needsPrediction = match.state === MatchStateEnum.Upcoming && !predicted
    const chipGlyph = predicted ? CHIP_GLYPH[predicted.chip] : undefined

    return (
        <div className="rounded-lg px-4 py-3 min-w-[200px] text-left">
            <div className="flex items-center justify-between gap-3">
                <PillFlag code={homeCode} name={match.homeTeam}/>
                {(isCompleted || isLive) && hasScore ? (
                    <span className={`font-display text-base font-black tabular-nums ${isLive ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-gray-100"}`}>{match.homeScore} - {match.awayScore}</span>
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
                    <span className="inline-flex items-center gap-1.5 font-bold text-pitch-700 dark:text-pitch-300">
                        {chipGlyph && (
                            <span className="rounded border border-pitch-600/30 bg-pitch-600/15 px-1 py-0.5 text-[9px] font-black leading-none tabular-nums text-pitch-800 dark:border-pitch-400/30 dark:bg-pitch-400/15 dark:text-pitch-300">
                                {chipGlyph}
                            </span>
                        )}
                        <span className="tabular-nums">{crowdPending ? "? - ?" : `${predicted.homeScore} - ${predicted.awayScore}`}</span>
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
