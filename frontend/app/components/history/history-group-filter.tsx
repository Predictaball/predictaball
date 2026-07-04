'use client'

import React, {useState} from "react"
import {GroupStandingRow, Match} from "@/client"
import HistoryMatchCard from "@/app/components/history/history-match-card"
import PredictionComparisonTable from "@/app/components/history/prediction-comparison-table"
import {KNOCKOUT_GROUP} from "@/app/util/group-matches"
import {BRAND_GRADIENT, SECTION_EYEBROW} from "@/app/util/css-classes"

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
                                        ? `bg-gradient-to-br ${BRAND_GRADIENT} text-white shadow-lg shadow-cyan-500/30`
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
                    <p className={SECTION_EYEBROW + " text-center"}>Predicted vs actual table</p>
                    <PredictionComparisonTable group={active} actualStandings={actualStandings} predictedStandings={predictedStandings}/>
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
