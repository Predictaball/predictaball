import React from "react"
import Link from "next/link"
import {CountryLeaderboardInner} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {PODIUM_ROW} from "@/app/util/css-classes"

interface CountryRankingEntryProps {
    entry: CountryLeaderboardInner
}

// Show the score rounded to a single decimal place (e.g. "5.0").
function formatScore(score: number): string {
    return score.toFixed(1)
}

export default function CountryRankingEntry(props: CountryRankingEntryProps): React.JSX.Element {
    const {entry} = props
    const isPodium = entry.position <= 3

    return (
        <Link
            href={`/app/league/${entry.leagueId}/leaderboard`}
            className={`group relative block w-full max-w-2xl border-l-[3px] border-b border-b-slate-200 dark:border-b-white/10 transition-colors hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04] ${
                isPodium
                    ? PODIUM_ROW[entry.position as 1 | 2 | 3]
                    : "border-l-transparent"
            }`}
        >
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 text-center font-display text-lg font-black tabular-nums text-slate-900 dark:text-white shrink-0">
                    {entry.position}
                </div>
                <div className="flex w-[26px] justify-center shrink-0">
                    {entry.flagCode && <FlagImage code={entry.flagCode} name={entry.teamName} size={26}/>}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {entry.teamName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">
                        {entry.predictorCount} {entry.predictorCount === 1 ? "predictor" : "predictors"} · {entry.predictedMatches} {entry.predictedMatches === 1 ? "match" : "matches"}
                    </div>
                </div>
                <div className="w-16 text-center font-display text-lg font-black tabular-nums text-pitch-700 dark:text-pitch-300 shrink-0">
                    {formatScore(entry.score)}
                </div>
            </div>
        </Link>
    )
}
