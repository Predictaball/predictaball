import React from "react"
import {Match, MatchStateEnum} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {COUNTRY_CODES} from "@/app/util/teams"
import {LIVE_DOT} from "@/app/util/css-classes"

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
    const isLive = match.state === MatchStateEnum.Live
    // "Live Score" while in play, "Result" once finished; nothing pre-kickoff.
    const label = isLive ? "Live Score" : hasScore ? "Result" : undefined

    return (
        <div className="flex flex-col items-center gap-1.5">
            {label && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-500 dark:bg-black/50 dark:border-white/10 dark:text-gray-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur">
                    {isLive && <span className={LIVE_DOT}/>}
                    {label}
                </span>
            )}
            <div className="flex items-center gap-2.5 rounded-full bg-white/80 border border-slate-200 dark:bg-black/50 dark:border-white/10 px-3.5 py-1.5 backdrop-blur">
                <FlagImage code={homeCode} name={match.homeTeam} size={24}/>
                <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{teamLabel(match.homeTeam)}</span>
                <span className="px-1 text-lg font-black tabular-nums text-slate-900 dark:text-white">
                    {hasScore ? `${match.homeScore} - ${match.awayScore}` : "vs"}
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{teamLabel(match.awayTeam)}</span>
                <FlagImage code={awayCode} name={match.awayTeam} size={24}/>
            </div>
        </div>
    )
}
