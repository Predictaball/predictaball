'use client'

import React from "react"
import {useRouter} from "next/navigation"
import {GetLeagueLeaderboardStageEnum} from "@/client"
import {BRAND_GRADIENT} from "@/app/util/css-classes"

interface StageTabsProps {
    leagueId: string
    activeStage: GetLeagueLeaderboardStageEnum
}

const STAGES: { value: GetLeagueLeaderboardStageEnum, label: string }[] = [
    {value: GetLeagueLeaderboardStageEnum.All, label: "All"},
    {value: GetLeagueLeaderboardStageEnum.GroupStage, label: "Group Stage"},
    {value: GetLeagueLeaderboardStageEnum.Knockout, label: "Knockout"},
]

// Mirrors the selected stage into the URL (via replace, so it doesn't grow
// browser history) so the leaderboard re-fetches filtered to that stage.
export default function StageTabs({leagueId, activeStage}: StageTabsProps): React.JSX.Element {
    const router = useRouter()

    function selectStage(stage: GetLeagueLeaderboardStageEnum): void {
        const query = stage === GetLeagueLeaderboardStageEnum.All ? "" : `?stage=${stage}`
        router.replace(`/app/league/${leagueId}/leaderboard${query}`, {scroll: false})
    }

    return (
        <div className="flex flex-wrap justify-center gap-2">
            {STAGES.map(({value, label}) => {
                const isActive = value === activeStage
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => selectStage(value)}
                        aria-pressed={isActive}
                        className={`flex h-9 items-center justify-center rounded-full px-4 text-sm font-bold transition-colors ${
                            isActive
                                ? `bg-gradient-to-br ${BRAND_GRADIENT} text-white shadow-lg shadow-cyan-500/30`
                                : "bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                        }`}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}
