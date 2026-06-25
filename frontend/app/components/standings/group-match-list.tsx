import React from "react"
import Link from "next/link"
import {MatchStateEnum} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {LocalTime} from "@/app/components/predictions/local-time"
import type {GroupMatch} from "@/app/components/flags/group-venue-map"

interface GroupMatchListProps {
    group: string
    matches: GroupMatch[]
}

// Every fixture in the selected group, each linking through to its own match
// page — the same destination the map's venue pills point to.
export default function GroupMatchList({group, matches}: GroupMatchListProps): React.JSX.Element {
    return (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
            <div className="rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-xl p-4 space-y-2">
                <h3 className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                    Group {group} fixtures
                </h3>
                {matches.length === 0 ? (
                    <p className="px-1 py-4 text-center text-sm text-slate-500 dark:text-gray-400">
                        No fixtures scheduled yet.
                    </p>
                ) : (
                    matches.map(m => <MatchRow key={m.matchId} match={m}/>)
                )}
            </div>
        </div>
    )
}

function MatchRow({match}: {match: GroupMatch}): React.JSX.Element {
    const live = match.state === MatchStateEnum.Live
    const completed = match.state === MatchStateEnum.Completed
    const kickedOff = live || completed
    const hasScore = match.homeScore !== undefined && match.awayScore !== undefined

    const className = "flex items-center gap-3 rounded-2xl border border-slate-900/5 bg-slate-900/[0.02] px-3 py-2.5 transition-colors hover:bg-slate-900/5 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/5"

    const content = (
        <>
            <div className="flex flex-1 items-center gap-2 min-w-0">
                <FlagImage code={match.homeFlagCode.toLowerCase()} name={match.homeTeam} size={28}/>
                <span className="truncate text-sm font-semibold text-slate-700 dark:text-gray-200">{match.homeTeam}</span>
            </div>

            <div className="flex shrink-0 flex-col items-center text-center">
                {completed && hasScore ? (
                    <span className="text-sm font-black tabular-nums text-slate-800 dark:text-gray-100">
                        {match.homeScore} - {match.awayScore}
                    </span>
                ) : live && hasScore ? (
                    <span className="inline-flex items-center gap-1 text-sm font-black tabular-nums text-rose-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"/>
                        {match.homeScore} - {match.awayScore}
                    </span>
                ) : (
                    <span className="text-xs font-semibold text-slate-400 dark:text-gray-500">vs</span>
                )}
                <span className="mt-0.5 text-[11px] text-slate-400 dark:text-gray-500">
                    <LocalTime date={match.datetime}/>
                </span>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                <span className="truncate text-right text-sm font-semibold text-slate-700 dark:text-gray-200">{match.awayTeam}</span>
                <FlagImage code={match.awayFlagCode.toLowerCase()} name={match.awayTeam} size={28}/>
            </div>
        </>
    )

    // Fixtures that haven't kicked off yet don't have anything to show on the
    // match page, so they're rendered as plain rows rather than links.
    if (!kickedOff) {
        return <div className={className}>{content}</div>
    }

    return (
        <Link href={`/app/match/${match.matchId}/predictions`} className={className}>
            {content}
        </Link>
    )
}
