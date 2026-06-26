'use client'

import React, {useState} from "react"
import {GroupStandingRow, Match} from "@/client"
import HistoryMatchCard from "@/app/components/history/history-match-card"
import PredictionComparisonTable from "@/app/components/history/prediction-comparison-table"
import {KNOCKOUT_GROUP} from "@/app/util/group-matches"
import {SECTION_EYEBROW} from "@/app/util/css-classes"

interface HistoryGroupFilterProps {
    matchesByGroup: Record<string, Match[]>
    groupOrder: string[]
    initialGroup?: string
    predictedStandingsByGroup: Record<string, GroupStandingRow[]>
    actualStandingsByGroup: Record<string, GroupStandingRow[]>
}

export default function HistoryGroupFilter({matchesByGroup, groupOrder, initialGroup, predictedStandingsByGroup, actualStandingsByGroup}: HistoryGroupFilterProps): React.JSX.Element {
    const [active, setActive] = useState(initialGroup ?? groupOrder[0])
    const matches = matchesByGroup[active] ?? []
    const predictedStandings = predictedStandingsByGroup[active]
    const actualStandings = actualStandingsByGroup[active]

    return (
        <div className="space-y-4">
            {groupOrder.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {groupOrder.map(group => {
                        const isActive = group === active
                        return (
                            <button
                                key={group}
                                type="button"
                                onClick={() => setActive(group)}
                                aria-pressed={isActive}
                                className={`flex h-9 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors ${
                                    isActive
                                        ? "bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 text-white shadow-lg shadow-cyan-500/30"
                                        : "bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                }`}
                            >
                                {group}
                            </button>
                        )
                    })}
                </div>
            )}

            {active !== KNOCKOUT_GROUP && predictedStandings && actualStandings && (
                <div className="space-y-2">
                    <p className={SECTION_EYEBROW + " text-center"}>Final table vs your prediction</p>
                    <PredictionComparisonTable group={active} actualStandings={actualStandings} predictedStandings={predictedStandings}/>
                    <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] text-slate-500 dark:text-gray-400">
                        <span><span className="font-semibold text-slate-600 dark:text-gray-300">Your call</span> = where you predicted each team.</span>
                        <span className="inline-flex items-center gap-1"><span className="font-bold text-emerald-600 dark:text-emerald-400">▲</span> predicted higher than they finished</span>
                        <span className="inline-flex items-center gap-1"><span className="font-bold text-rose-600 dark:text-rose-400">▼</span> predicted lower than they finished</span>
                        <span className="inline-flex items-center gap-1"><span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span> spot on</span>
                    </p>
                </div>
            )}

            <div className="flex flex-col items-center gap-3">
                {matches.length > 0 ? matches.map(match => (
                    <HistoryMatchCard match={match} key={match.matchId}/>
                )) : (
                    <p className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">No matches in this group yet.</p>
                )}
            </div>
        </div>
    )
}
