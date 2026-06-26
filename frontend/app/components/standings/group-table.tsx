import React from "react"
import {GroupStandingRow} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"

/**
 * Background tint for a row based on where the team sits. Top two qualify for
 * the knockouts directly; third place may still go through as a best third.
 */
function positionAccent(position: number): string {
    if (position <= 2) return "bg-emerald-500/10 dark:bg-emerald-400/10"
    if (position === 3) return "bg-amber-500/10 dark:bg-amber-400/10"
    return ""
}

function positionDot(position: number): string {
    if (position <= 2) return "bg-emerald-500"
    if (position === 3) return "bg-amber-500"
    return "bg-slate-300 dark:bg-white/20"
}

/**
 * Small arrow showing how a team's real finish differs from where it sits in
 * this table. `delta` is `thisTablePosition - actualPosition`, so a positive
 * value means the team actually finished higher (a smaller position number)
 * than shown here — an up arrow.
 */
function PositionDelta({delta}: {delta: number}): React.JSX.Element {
    if (delta === 0) {
        return (
            <span title="Exactly as you predicted" className="shrink-0 text-[11px] font-bold leading-none text-slate-400 dark:text-gray-500">=</span>
        )
    }
    const up = delta > 0
    return (
        <span
            title={`Actually finished ${Math.abs(delta)} place${Math.abs(delta) === 1 ? "" : "s"} ${up ? "higher" : "lower"}`}
            className={`inline-flex shrink-0 items-center gap-px text-[11px] font-bold leading-none tabular-nums ${
                up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
        >
            <span aria-hidden>{up ? "▲" : "▼"}</span>{Math.abs(delta)}
        </span>
    )
}

interface GroupTableProps {
    group: string
    standings: GroupStandingRow[]
    /** Show country flags next to team names (default true). */
    showFlags?: boolean
    /** Per-team `thisTablePosition - actualPosition`, rendered as a diff arrow. */
    positionDeltas?: Record<string, number>
}

export default function GroupTable({group, standings, showFlags = true, positionDeltas}: GroupTableProps): React.JSX.Element {
    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-xl shadow-slate-900/5 dark:shadow-cyan-500/5">
            <div className="rounded-3xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 text-sm font-black text-white">
                        {group}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-200">Group {group}</span>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-gray-500">
                            <th className="py-1.5 pl-4 pr-1 text-left font-semibold">#</th>
                            <th className="py-1.5 px-1 text-left font-semibold">Team</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-7">P</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-7 hidden sm:table-cell">W</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-7 hidden sm:table-cell">D</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-7 hidden sm:table-cell">L</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-9">GD</th>
                            <th className="py-1.5 pl-1 pr-4 text-center font-semibold w-9">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map(row => (
                            <tr key={row.teamId} className={`border-t border-slate-900/5 dark:border-white/5 ${positionAccent(row.position)}`}>
                                <td className="py-2 pl-4 pr-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className={`h-1.5 w-1.5 rounded-full ${positionDot(row.position)}`}/>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">{row.position}</span>
                                    </span>
                                </td>
                                <td className="py-2 px-1">
                                    <span className="flex items-center gap-2 min-w-0">
                                        {showFlags && <FlagImage code={row.flagCode} name={row.teamName} size={22}/>}
                                        <span className="truncate font-semibold text-slate-800 dark:text-gray-100">{row.teamName}</span>
                                        {positionDeltas && <PositionDelta delta={positionDeltas[row.teamId] ?? 0}/>}
                                    </span>
                                </td>
                                <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300">{row.played}</td>
                                <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300 hidden sm:table-cell">{row.won}</td>
                                <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300 hidden sm:table-cell">{row.drawn}</td>
                                <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300 hidden sm:table-cell">{row.lost}</td>
                                <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                                <td className="py-2 pl-1 pr-4 text-center tabular-nums font-black text-slate-900 dark:text-white">{row.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
