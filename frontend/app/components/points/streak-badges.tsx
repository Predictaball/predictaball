import React from "react"
import {Streaks} from "@/app/util/streaks"

// A streak only feels like a streak once it's two-deep, so shorter runs are
// hidden to avoid cluttering the UI for new players.
const MIN_STREAK = 2
// Above this a points streak is "on fire" and gets the warm flame treatment.
const HOT_STREAK = 3

function StreakPill({
    icon,
    value,
    label,
    hot = false,
}: {
    icon: string
    value: number
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

// Shows the player's current prediction and points streaks as pills. Renders
// nothing when neither streak is meaningful yet.
export default function StreakBadges({streaks, className = ""}: {streaks: Streaks, className?: string}): React.JSX.Element | null {
    const showPrediction = streaks.prediction >= MIN_STREAK
    const showPoints = streaks.points >= MIN_STREAK
    if (!showPrediction && !showPoints) return null

    return (
        <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
            {showPrediction && (
                <StreakPill icon="🎯" value={streaks.prediction} label="predicted in a row" />
            )}
            {showPoints && (
                <StreakPill icon="🔥" value={streaks.points} label="scoring streak" hot={streaks.points >= HOT_STREAK} />
            )}
        </div>
    )
}
