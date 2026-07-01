import React from "react"
import Link from "next/link"
import { FlagImage } from "@/app/components/predictions/flag-image"
import { BracketMatch, ToGoThrough } from "@/client"
import { DerivedTeam } from "@/app/util/bracket-layout"

export interface CellDims {
    /** A fixed pixel width for the tree, or a CSS width (e.g. "100%") for the fluid mobile list. */
    width: number | string
    height: number
    compact: boolean
}

/**
 * Predictions for this match aren't open yet: it's in the DB (teams may be known)
 * but its prediction window hasn't opened. Decided/in-play matches are never locked.
 */
export function isMatchLocked(match: BracketMatch): boolean {
    return match.state === "UPCOMING" && !match.predictable
}

interface BracketCellProps {
    match: BracketMatch
    /** Predictions for this match aren't open yet (a future round). */
    locked: boolean
    dims: CellDims
    /**
     * Show only the real result (which side went through) with no pick overlay —
     * used by the standings page's tournament bracket, where a personal run makes
     * no sense. Suppresses the backed-side accent, the points, and the padlock.
     */
    resultsOnly?: boolean
    /**
     * Whether a completed cell links through to its match page. Off for the
     * dashboard preview, where the whole card is a single link to the full
     * bracket and a nested anchor would be invalid.
     */
    interactive?: boolean
}

/**
 * A single match cell in the bracket tree: the two teams stacked, the side the
 * user backed accented (and coloured by outcome once decided), the side that
 * actually went through ticked, and the points the pick earned. Locked matches
 * (a round you can't predict yet) are greyed out and show a padlock. In
 * `resultsOnly` mode the pick overlay is dropped and only the real result shows.
 */
export default function BracketCell({ match, locked, dims, resultsOnly = false, interactive = true }: BracketCellProps): React.JSX.Element {
    const completed = !locked && match.state === "COMPLETED" && match.actualGoThrough != null
    const points = match.basePoints + match.bonusPoints
    const flagSize = dims.compact ? 15 : 18
    const nameClass = dims.compact ? "text-[11px]" : "text-[12px]"
    // In results mode there's no personal run, so ignore the user's pick entirely.
    const userPick = resultsOnly ? undefined : match.userPick
    const correct = resultsOnly ? undefined : match.correct

    const inner = (
        <div
            className={`relative flex flex-col overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm ${
                locked
                    ? "border-dashed border-slate-900/15 bg-slate-500/[0.06] dark:border-white/15 dark:bg-white/[0.03]"
                    : "border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-white/[0.06]"
            }`}
            style={{ width: dims.width, height: dims.height }}
        >
            <TeamLine
                side="HOME" name={match.homeTeam} flag={match.homeTeamFlagCode}
                userPick={userPick} actual={completed ? match.actualGoThrough : undefined}
                correct={correct} points={points} bonus={match.bonusPoints}
                locked={locked} flagSize={flagSize} nameClass={nameClass}
            />
            <div className="h-px bg-slate-900/10 dark:bg-white/10" />
            <TeamLine
                side="AWAY" name={match.awayTeam} flag={match.awayTeamFlagCode}
                userPick={userPick} actual={completed ? match.actualGoThrough : undefined}
                correct={correct} points={points} bonus={match.bonusPoints}
                locked={locked} flagSize={flagSize} nameClass={nameClass}
            />
            {locked && (
                <span
                    className="absolute right-1 top-1/2 grid -translate-y-1/2 place-items-center rounded-full bg-slate-900/10 p-1 dark:bg-white/15"
                    title="Predictions not open yet"
                    aria-label="Predictions not open yet"
                >
                    <LockIcon className="h-3 w-3 text-slate-500 dark:text-gray-300" />
                </span>
            )}
        </div>
    )

    return completed && interactive
        ? <Link href={`/app/match/${match.matchId}/predictions`}>{inner}</Link>
        : inner
}

function TeamLine({ side, name, flag, userPick, actual, correct, points, bonus, locked, flagSize, nameClass }: {
    side: ToGoThrough
    name: string
    flag: string
    userPick?: ToGoThrough
    actual?: ToGoThrough
    correct?: boolean
    points: number
    bonus: number
    locked: boolean
    flagSize: number
    nameClass: string
}): React.JSX.Element {
    const picked = !locked && userPick === side
    const through = !locked && actual === side

    const tint = !picked
        ? ""
        : correct === true
            ? "bg-emerald-500/15"
            : correct === false
                ? "bg-rose-500/15"
                : "bg-cyan-500/10"
    const bar = !picked
        ? "bg-transparent"
        : correct === true
            ? "bg-emerald-500"
            : correct === false
                ? "bg-rose-500"
                : "bg-cyan-500"
    const nameColor = locked
        ? "font-medium text-slate-400 dark:text-gray-500"
        : picked
            ? "font-bold"
            : "font-medium text-slate-600 dark:text-gray-300"

    return (
        <div className={`flex flex-1 items-center gap-1.5 pr-1.5 ${tint} ${locked ? "opacity-80" : ""}`}>
            <span className={`h-full w-0.5 shrink-0 ${bar}`} />
            <FlagImage code={flag} name={name} size={flagSize} />
            <span className={`min-w-0 flex-1 truncate leading-none ${nameClass} ${nameColor}`}>
                {name}
            </span>
            {picked && correct
                ? (
                    <span className="shrink-0 text-[11px] font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{points}{bonus > 0 && <span aria-label="streak bonus">🔥</span>}
                    </span>
                )
                : through
                    ? <span aria-label="went through" className="shrink-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                    : null}
        </div>
    )
}

/**
 * An as-yet-unplayed slot. Once the matches feeding it have results, the teams
 * that went through are shown (one line filled while a single feeder is decided,
 * both once it's a full tie); until then each unknown side reads "TBD".
 */
export function PlaceholderCell({ dims, home, away }: {
    dims: CellDims
    home?: DerivedTeam
    away?: DerivedTeam
}): React.JSX.Element {
    const flagSize = dims.compact ? 15 : 18
    const nameClass = dims.compact ? "text-[11px]" : "text-[12px]"
    return (
        <div
            className="flex flex-col overflow-hidden rounded-xl border border-dashed border-slate-900/10 bg-slate-500/[0.04] dark:border-white/10 dark:bg-white/[0.02]"
            style={{ width: dims.width, height: dims.height }}
        >
            <FeederLine team={home} flagSize={flagSize} nameClass={nameClass} />
            <div className="h-px bg-slate-900/10 dark:bg-white/10" />
            <FeederLine team={away} flagSize={flagSize} nameClass={nameClass} />
        </div>
    )
}

function FeederLine({ team, flagSize, nameClass }: {
    team?: DerivedTeam
    flagSize: number
    nameClass: string
}): React.JSX.Element {
    if (!team) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-gray-600">TBD</span>
            </div>
        )
    }
    return (
        <div className="flex flex-1 items-center gap-1.5 pr-1.5">
            <span className="h-full w-0.5 shrink-0 bg-transparent" />
            <FlagImage code={team.flag} name={team.name} size={flagSize} />
            <span className={`min-w-0 flex-1 truncate font-medium leading-none text-slate-500 dark:text-gray-400 ${nameClass}`}>
                {team.name}
            </span>
        </div>
    )
}

export function LockIcon({ className }: { className?: string }): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    )
}
