import React from "react"
import {GroupStandingRow} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"

// The eight best third-placed teams advance to the round of 32.
const QUALIFYING_THIRD_PLACED = 8

export default function ThirdPlacedTable({rows}: {rows: GroupStandingRow[]}): React.JSX.Element {
    if (rows.length === 0) {
        return (
            <div className="rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 px-4 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
                No standings yet — check back once group matches have been played.
            </div>
        )
    }
    return (
        <div className="relative rounded-xl border-[1.5px] border-slate-300 dark:border-white/15 bg-white dark:bg-gray-900">
            <div className="rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-gray-500">
                            <th className="py-2 pl-4 pr-1 text-left font-semibold">#</th>
                            <th className="py-2 px-1 text-left font-semibold">Team</th>
                            <th className="py-2 px-1 text-center font-semibold w-8">Grp</th>
                            <th className="py-2 px-1 text-center font-semibold w-7">P</th>
                            <th className="py-2 px-1 text-center font-semibold w-9">GD</th>
                            <th className="py-2 pl-1 pr-4 text-center font-semibold w-9">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => {
                            const qualifying = row.position <= QUALIFYING_THIRD_PLACED
                            return (
                                <tr key={row.teamId} className={`border-t border-slate-900/5 dark:border-white/5 ${qualifying ? "bg-emerald-500/10 dark:bg-emerald-400/10" : ""}`}>
                                    <td className="py-2 pl-4 pr-1">
                                        <span className="flex items-center gap-1.5">
                                            <span className={`h-1.5 w-1.5 rounded-full ${qualifying ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"}`}/>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">{row.position}</span>
                                        </span>
                                    </td>
                                    <td className="py-2 px-1">
                                        <span className="flex items-center gap-2 min-w-0">
                                            <FlagImage code={row.flagCode} name={row.teamName} size={22}/>
                                            <span className="truncate font-semibold text-slate-800 dark:text-gray-100">{row.teamName}</span>
                                        </span>
                                    </td>
                                    <td className="py-2 px-1 text-center font-bold text-slate-500 dark:text-gray-400">{row.group}</td>
                                    <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300">{row.played}</td>
                                    <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                                    <td className="py-2 pl-1 pr-4 text-center tabular-nums font-black text-slate-900 dark:text-white">{row.points}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
