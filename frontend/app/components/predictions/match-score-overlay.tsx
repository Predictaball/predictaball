import React from "react"
import {Match} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {COUNTRY_CODES} from "@/app/util/teams"

function teamLabel(team: string): string {
    return COUNTRY_CODES[team.toLowerCase()] ?? team
}

// Frosted score pill that sits over the globe: home flag/label, the scoreline
// (or "vs" before kickoff), then the away label/flag. Shared by the match
// predictions page (as a result overlay) and the live prediction card.
export function MatchScoreOverlay({match}: {match: Match}): React.JSX.Element {
    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()
    const hasScore = match.homeScore !== undefined && match.awayScore !== undefined

    return (
        <div className="flex items-center gap-2.5 rounded-full bg-white/80 border border-slate-200 dark:bg-black/50 dark:border-white/10 px-3.5 py-1.5 backdrop-blur">
            <FlagImage code={homeCode} name={match.homeTeam} size={24}/>
            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{teamLabel(match.homeTeam)}</span>
            <span className="px-1 text-lg font-black tabular-nums text-slate-900 dark:text-white">
                {hasScore ? `${match.homeScore} - ${match.awayScore}` : "vs"}
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{teamLabel(match.awayTeam)}</span>
            <FlagImage code={awayCode} name={match.awayTeam} size={24}/>
        </div>
    )
}
