import React from "react"
import {StreakStats} from "@/app/util/streaks"

// A points streak only feels like a streak once it's two-deep, so shorter runs
// are hidden to avoid cluttering the UI for new players.
const MIN_POINTS_STREAK = 2
// Above this a points streak is "on fire" and gets the warm flame treatment.
const HOT_STREAK = 3
// A prediction rate needs a few games behind it before the percentage means
// anything (100% off a single match isn't worth shouting about).
const MIN_PLAYED_FOR_RATE = 3

function StreakPill({
    icon,
    value,
    label,
    hot = false,
}: {
    icon: string
    value: React.ReactNode
    label: string
    hot?: boolean
}): React.JSX.Element {
    return (
        <span
            className={
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm border " +
                (hot
                    ? "border-amber-500/30 bg-amber-500/10 dark:border-amber-400/30 dark:bg-amber-400/10"
                    : "border-slate-900/10 bg-slate-900/5 dark:border-white/10 dark:bg-white/5")
            }
        >
            <span className={hot ? "animate-pulse" : ""} aria-hidden>{icon}</span>
            <span className={`font-bold tabular-nums ${hot ? "text-amber-600 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}>{value}</span>
            <span className="text-slate-500 dark:text-gray-400 text-[11px] uppercase tracking-[0.15em]">{label}</span>
        </span>
    )
}

// The prediction-rate pill on its own, so it can live apart from the points
// headline (e.g. right-aligned in the Completed matches row header). Renders
// nothing until there are enough games for the percentage to mean anything.
export function PredictionRatePill({stats}: {stats: StreakStats}): React.JSX.Element | null {
    if (stats.played < MIN_PLAYED_FOR_RATE) return null
    return <StreakPill icon="✅" value={`${Math.round(stats.predictionRate * 100)}%`} label="prediction rate" />
}

// The scoring-streak pill on its own. Hidden until a run is at least two-deep.
export function ScoringStreakPill({stats}: {stats: StreakStats}): React.JSX.Element | null {
    if (stats.pointsStreak < MIN_POINTS_STREAK) return null
    return <StreakPill icon="🔥" value={stats.pointsStreak} label="scoring streak" hot={stats.pointsStreak >= HOT_STREAK} />
}

// The bare streak pills, with no wrapper, so they can be dropped straight into
// an existing pill row. Renders nothing when neither stat is meaningful yet.
export function StreakPills({stats}: {stats: StreakStats}): React.JSX.Element | null {
    const rate = PredictionRatePill({stats})
    const points = ScoringStreakPill({stats})
    if (!rate && !points) return null

    return (
        <>
            {rate}
            {points}
        </>
    )
}

// Standalone, self-centring version for surfaces without an existing pill row
// (e.g. the player history header).
export default function StreakBadges({stats, className = ""}: {stats: StreakStats, className?: string}): React.JSX.Element | null {
    const pills = StreakPills({stats})
    if (!pills) return null

    return (
        <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
            {pills}
        </div>
    )
}
