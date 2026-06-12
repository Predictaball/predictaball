import React from "react"
import {CountryLeaderboardInner} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"

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
        <div
            className={`group relative w-full max-w-2xl rounded-2xl p-[1px] mb-2.5 transition-transform hover:scale-[1.01] ${
                isPodium
                    ? "bg-gradient-to-r from-slate-900/20 to-slate-900/10 dark:from-white/25 dark:to-white/10"
                    : "bg-slate-900/10 dark:bg-white/10"
            }`}
        >
            <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-gray-900/85 backdrop-blur-sm px-4 py-3">
                <div className="w-9 text-center text-lg font-black tabular-nums text-slate-900 dark:text-white shrink-0">
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
                <div className="w-16 text-center font-black tabular-nums bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent shrink-0">
                    {formatScore(entry.score)}
                </div>
            </div>
        </div>
    )
}
