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
            <div className="group rounded-xl border-[1.5px] border-slate-300 dark:border-white/15 bg-white dark:bg-gray-900 transition-transform hover:scale-[1.01]">
                <div className="flex items-center justify-between rounded-xl px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-pitch-600/15 dark:bg-pitch-400/15 flex items-center justify-center text-sm font-black text-pitch-800 dark:text-pitch-200">
                            {props.leagueName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {props.leagueName}
                        </div>
                    </div>
                    <div className="font-black tabular-nums text-pitch-700 dark:text-pitch-300">
                        {positionLabel}
                    </div>
                </div>
            </div>
        </Link>
    )
}
