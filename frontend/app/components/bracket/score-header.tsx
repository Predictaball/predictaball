import React from "react"
import SurfaceCard from "@/app/components/surface-card"
import { BRAND_TEXT_GRADIENT } from "@/app/util/css-classes"

interface ScoreHeaderProps {
    totalPoints: number
    currentStreak: number
    bestStreak: number
}

/** The cup scoreboard: total points and the current / best kickoff-order streak. */
export default function ScoreHeader({ totalPoints, currentStreak, bestStreak }: ScoreHeaderProps): React.JSX.Element {
    return (
        <SurfaceCard innerClassName="p-4 sm:p-5">
            <div className="grid grid-cols-3 divide-x divide-slate-900/10 dark:divide-white/10 text-center">
                <Stat label="Cup points" value={totalPoints} highlight />
                <Stat label="Current streak" value={currentStreak} flame={currentStreak > 1} />
                <Stat label="Best streak" value={bestStreak} />
            </div>
        </SurfaceCard>
    )
}

function Stat({ label, value, highlight = false, flame = false }: {
    label: string
    value: number
    highlight?: boolean
    flame?: boolean
}): React.JSX.Element {
    return (
        <div className="px-2 sm:px-3">
            <div className={`font-display text-3xl sm:text-4xl font-black tabular-nums ${highlight ? BRAND_TEXT_GRADIENT : "text-slate-900 dark:text-white"}`}>
                {flame && <span aria-hidden className="mr-0.5">🔥</span>}
                {value}
            </div>
            <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                {label}
            </div>
        </div>
    )
}
