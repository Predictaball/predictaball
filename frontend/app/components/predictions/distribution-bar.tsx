import React from "react"
import {PredictionDistribution} from "@/client"
import {SHORT_COUNTRY_NAMES} from "@/app/util/teams"

export default function DistributionBar({distribution, homeName, awayName}: {
    distribution: PredictionDistribution
    homeName: string
    awayName: string
}) {
    const total = distribution.home + distribution.draw + distribution.away
    if (total === 0) return null
    const homePct = (distribution.home / total) * 100
    const drawPct = (distribution.draw / total) * 100
    const awayPct = (distribution.away / total) * 100
    const homeShort = SHORT_COUNTRY_NAMES[homeName.toLowerCase()] ?? homeName
    const awayShort = SHORT_COUNTRY_NAMES[awayName.toLowerCase()] ?? awayName
    return (
        <div className="mt-4">
            <div className="relative flex justify-between text-[10px] uppercase tracking-wider font-semibold mb-1">
                <span className="truncate max-w-[40%] text-cyan-600 dark:text-cyan-300" title={`${homeShort} ${Math.round(homePct)}%`}>{homeShort} {Math.round(homePct)}%</span>
                <span className="absolute left-1/2 -translate-x-1/2 text-slate-500 dark:text-gray-400" title={`Draw ${Math.round(drawPct)}%`}>Draw {Math.round(drawPct)}%</span>
                <span className="truncate max-w-[40%] text-right text-indigo-500 dark:text-indigo-300" title={`${awayShort} ${Math.round(awayPct)}%`}>{awayShort} {Math.round(awayPct)}%</span>
            </div>
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-white/10">
                <div className="bg-cyan-300" style={{width: `${homePct}%`}}/>
                <div className="bg-slate-400 dark:bg-gray-500" style={{width: `${drawPct}%`}}/>
                <div className="bg-indigo-400" style={{width: `${awayPct}%`}}/>
            </div>
        </div>
    )
}
