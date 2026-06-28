import React from "react"
import SurfaceCard from "@/app/components/surface-card"
import { BRAND_TEXT_GRADIENT } from "@/app/util/css-classes"

interface ScoreHeaderProps {
    totalPoints: number
}

export default function ScoreHeader({ totalPoints }: ScoreHeaderProps): React.JSX.Element {
    return (
        <SurfaceCard innerClassName="p-4 sm:p-5">
            <div className="text-center">
                <div className={`font-display text-4xl sm:text-5xl font-black tabular-nums ${BRAND_TEXT_GRADIENT}`}>
                    {totalPoints}
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                    Cup points
                </div>
            </div>
        </SurfaceCard>
    )
}
