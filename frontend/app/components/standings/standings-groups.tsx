'use client'

import React, {useState} from "react"
import {GroupStanding} from "@/client"
import GroupTable from "@/app/components/standings/group-table"
import GroupVenueMap from "@/app/components/flags/group-venue-map"
import type {GroupMatch} from "@/app/components/flags/group-venue-map"
import GroupMatchList from "@/app/components/standings/group-match-list"

interface StandingsGroupsProps {
    groups: GroupStanding[]
    matchesByGroup: Record<string, GroupMatch[]>
}

/**
 * Standings, one group at a time. A pill selector switches between groups; the
 * chosen group shows its table alongside a globe zoomed to the venues hosting
 * its fixtures, each marked with a pill of the matchup's flags.
 */
export default function StandingsGroups({groups, matchesByGroup}: StandingsGroupsProps): React.JSX.Element {
    const [active, setActive] = useState(groups[0]?.group)
    const selected = groups.find(g => g.group === active) ?? groups[0]
    const matches = matchesByGroup[selected.group] ?? []
    const venueCount = new Set(matches.map(m => m.venue)).size

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap justify-center gap-2">
                {groups.map(g => {
                    const isActive = g.group === selected.group
                    return (
                        <button
                            key={g.group}
                            type="button"
                            onClick={() => setActive(g.group)}
                            aria-pressed={isActive}
                            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors ${
                                isActive
                                    ? "bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 text-white shadow-lg shadow-cyan-500/30"
                                    : "bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                            }`}
                        >
                            {g.group}
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
                    <div className="relative rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                        <div className="relative w-full aspect-square sm:aspect-[16/10] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
                            <div className="absolute inset-0">
                                {matches.length > 0 ? (
                                    <GroupVenueMap key={selected.group} matches={matches}/>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-gray-400">
                                        Venues for Group {selected.group} will appear here once its fixtures are scheduled.
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 text-slate-700 dark:bg-black/50 dark:border-white/10 dark:text-gray-200 px-3 py-1 text-xs font-semibold backdrop-blur">
                                    Group {selected.group} venues
                                </span>
                                {venueCount > 0 && (
                                    <span className="rounded-full bg-white/80 border border-slate-200 text-slate-600 dark:bg-black/50 dark:border-white/10 dark:text-gray-300 px-3 py-1 text-xs backdrop-blur">
                                        {venueCount} {venueCount === 1 ? "venue" : "venues"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <GroupTable group={selected.group} standings={selected.standings}/>
            </div>

            <GroupMatchList group={selected.group} matches={matches}/>
        </section>
    )
}
