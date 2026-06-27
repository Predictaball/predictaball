import React from "react"
import {GroupStandingRow} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {positionAccent, positionDot} from "@/app/components/standings/group-table"

/**
 * Diff arrow showing how a team's predicted position compares to where it
 * really finished. `delta` is `actualPosition - predictedPosition`, so a
 * positive value means the team was predicted higher (a smaller position
 * number) than it actually finished — an up arrow.
 */
function CallDelta({delta}: {delta: number}): React.JSX.Element {
    if (delta === 0) {
        return (
            <span title="Finished exactly as predicted" className="shrink-0 text-[11px] font-bold leading-none text-emerald-600 dark:text-emerald-400">✓</span>
        )
    }
    const up = delta > 0
    return (
        <span
            title={`Predicted ${Math.abs(delta)} place${Math.abs(delta) === 1 ? "" : "s"} ${up ? "higher" : "lower"} than they finished`}
            className={`inline-flex shrink-0 items-center gap-px text-[11px] font-bold leading-none tabular-nums ${
                up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
        >
            <span aria-hidden>{up ? "▲" : "▼"}</span>
        </span>
    )
}

interface PredictionComparisonTableProps {
    group: string
    actualStandings: GroupStandingRow[]
    predictedStandings: GroupStandingRow[]
}

/**
 * Compares a user's predicted group table with the real one.
 *
 * On wider screens it renders a single table that follows the actual final
 * standings, with a "Predicted" column showing the predicted position and an
 * arrow for how far reality differed. On mobile it splits into two compact
 * flag-only mini-tables — actual on the left, predicted on the right — with the
 * diff arrows on the predicted side.
 */
export default function PredictionComparisonTable({group, actualStandings, predictedStandings}: PredictionComparisonTableProps): React.JSX.Element {
    const predictedPositionByTeam: Record<string, number> = {}
    for (const row of predictedStandings) predictedPositionByTeam[row.teamId] = row.position
    const actualPositionByTeam: Record<string, number> = {}
    for (const row of actualStandings) actualPositionByTeam[row.teamId] = row.position

    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-xl shadow-slate-900/5 dark:shadow-cyan-500/5">
            <div className="rounded-3xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 text-sm font-black text-white">
                        {group}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-200">Group {group}</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Final vs predicted</span>
                </div>

                {/* Desktop: single actual-anchored table with a "Predicted" column */}
                <table className="hidden w-full text-sm sm:table">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-gray-500">
                            <th className="py-1.5 pl-4 pr-1 text-left font-semibold">#</th>
                            <th className="py-1.5 px-1 text-left font-semibold">Team</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-7">W</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-7">D</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-7">L</th>
                            <th className="py-1.5 px-1 text-center font-semibold w-9">Pts</th>
                            <th className="py-1.5 pl-1 pr-4 text-center font-semibold">Predicted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actualStandings.map(row => {
                            const predicted = predictedPositionByTeam[row.teamId]
                            const delta = predicted != null ? row.position - predicted : undefined
                            return (
                                <tr key={row.teamId} className={`border-t border-slate-900/5 dark:border-white/5 ${positionAccent(row.position)}`}>
                                    <td className="py-2 pl-4 pr-1">
                                        <span className="flex items-center gap-1.5">
                                            <span className={`h-1.5 w-1.5 rounded-full ${positionDot(row.position)}`}/>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">{row.position}</span>
                                        </span>
                                    </td>
                                    <td className="py-2 px-1">
                                        <span className="flex items-center gap-2 min-w-0">
                                            <FlagImage code={row.flagCode} name={row.teamName} size={22}/>
                                            <span className="truncate font-semibold text-slate-800 dark:text-gray-100">{row.teamName}</span>
                                        </span>
                                    </td>
                                    <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300">{row.won}</td>
                                    <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300">{row.drawn}</td>
                                    <td className="py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300">{row.lost}</td>
                                    <td className="py-2 px-1 text-center tabular-nums font-black text-slate-900 dark:text-white">{row.points}</td>
                                    <td className="py-2 pl-1 pr-4">
                                        <span className="flex items-center justify-center gap-1.5">
                                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-slate-900/5 px-1 text-xs font-bold tabular-nums text-slate-600 dark:bg-white/10 dark:text-gray-300">
                                                {predicted ?? "–"}
                                            </span>
                                            {delta != null && <CallDelta delta={delta}/>}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Mobile: partitioned actual | predicted, flags only */}
                <div className="grid grid-cols-2 sm:hidden">
                    <div>
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Actual</p>
                        {actualStandings.map(row => (
                            <div key={row.teamId} className={`flex items-center gap-1.5 border-t border-slate-900/5 px-3 py-2 dark:border-white/5 ${positionAccent(row.position)}`}>
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${positionDot(row.position)}`}/>
                                <span className="w-3 shrink-0 text-xs font-semibold text-slate-500 dark:text-gray-400">{row.position}</span>
                                <FlagImage code={row.flagCode} name={row.teamName} size={20}/>
                                <span className="ml-auto tabular-nums font-black text-slate-900 dark:text-white">{row.points}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-l border-slate-900/10 dark:border-white/10">
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Predicted</p>
                        {predictedStandings.map(row => {
                            const actualPosition = actualPositionByTeam[row.teamId]
                            const delta = actualPosition != null ? actualPosition - row.position : undefined
                            return (
                                <div key={row.teamId} className={`flex items-center gap-1.5 border-t border-slate-900/5 px-3 py-2 dark:border-white/5 ${positionAccent(row.position)}`}>
                                    <span className="flex w-4 shrink-0 justify-center">{delta != null && <CallDelta delta={delta}/>}</span>
                                    <FlagImage code={row.flagCode} name={row.teamName} size={20}/>
                                    <span className="ml-auto tabular-nums font-black text-slate-900 dark:text-white">{row.points}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-slate-900/5 px-4 py-2.5 text-[10px] font-semibold text-slate-400 dark:border-white/5 dark:text-gray-500">
                    <span className="inline-flex items-center gap-1"><span className="text-emerald-600 dark:text-emerald-400">▲</span> predicted higher</span>
                    <span className="inline-flex items-center gap-1"><span className="text-rose-600 dark:text-rose-400">▼</span> predicted lower</span>
                    <span className="inline-flex items-center gap-1"><span className="text-emerald-600 dark:text-emerald-400">✓</span> spot on</span>
                </div>
            </div>
        </div>
    )
}
