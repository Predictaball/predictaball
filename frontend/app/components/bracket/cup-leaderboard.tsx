import React from "react"
import SurfaceCard from "@/app/components/surface-card"
import { BracketLeaderboardRow } from "@/client"

interface CupLeaderboardProps {
    rows: BracketLeaderboardRow[]
    currentUserId?: string
}

/** League standings for the Knockout Cup; the leader(s) carry the trophy. */
export default function CupLeaderboard({ rows, currentUserId }: CupLeaderboardProps): React.JSX.Element {
    if (rows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-900/15 dark:border-white/15 p-8 text-center text-sm text-slate-500 dark:text-gray-400">
                No cup scores yet — points land as the knockout matches are played.
            </div>
        )
    }

    return (
        <SurfaceCard innerClassName="p-2 sm:p-3">
            <ul className="divide-y divide-slate-900/5 dark:divide-white/5">
                {rows.map((row) => {
                    const isYou = row.userId === currentUserId
                    return (
                        <li
                            key={row.userId}
                            className={`flex items-center gap-3 rounded-xl px-2 py-2.5 ${isYou ? "bg-cyan-500/5" : ""}`}
                        >
                            <span className="w-6 text-center font-bold tabular-nums text-slate-500 dark:text-gray-400">
                                {row.position}
                            </span>
                            <span className="flex min-w-0 flex-1 items-center gap-1.5">
                                <span className="truncate font-semibold">
                                    {row.firstName} {row.familyName}
                                </span>
                                {isYou && (
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">you</span>
                                )}
                                {row.isCupHolder && (
                                    <span title="Knockout Cup holder" aria-label="Knockout Cup holder">🏆</span>
                                )}
                            </span>
                            <span className="font-display text-lg font-black tabular-nums text-slate-900 dark:text-white">
                                {row.totalPoints}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </SurfaceCard>
    )
}
