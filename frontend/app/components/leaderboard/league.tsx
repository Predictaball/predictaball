import React from "react"
import Link from "next/link"

interface LeagueProps {
    leagueId: string,
    leagueName: string,
    yourPosition?: number
}

export default function LeagueComponent(props: LeagueProps): React.JSX.Element {
    const positionLabel = props.yourPosition !== undefined ? props.yourPosition.toString() : "—"

    return (
        <Link href={`app/league/${props.leagueId}/leaderboard`} className="block">
            <div className="group rounded-2xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] transition-transform hover:scale-[1.01]">
                <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/30 via-cyan-400/30 to-teal-300/30 flex items-center justify-center text-sm font-black text-cyan-700 dark:text-cyan-200">
                            {props.leagueName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {props.leagueName}
                        </div>
                    </div>
                    <div className="font-black tabular-nums bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">
                        {positionLabel}
                    </div>
                </div>
            </div>
        </Link>
    )
}
