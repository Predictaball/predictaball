'use client'

import React, {useState} from "react"
import {useRouter} from "next/navigation"
import {GroupStanding} from "@/client"
import GroupTable from "@/app/components/standings/group-table"
import type {GroupMatch} from "@/app/components/flags/group-venue-map"
import GroupMatchList from "@/app/components/standings/group-match-list"
import {BRAND_GRADIENT} from "@/app/util/css-classes"

interface StandingsGroupsProps {
    groups: GroupStanding[]
    matchesByGroup: Record<string, GroupMatch[]>
    initialGroup?: string
}

/**
 * Standings, one group at a time. A pill selector switches between groups; the
 * chosen group shows its table.
 *
 * The selected group is mirrored into the URL (via replace, so it doesn't grow
 * browser history) so that navigating to a match and back lands on the same
 * group instead of resetting to the first one.
 */
export default function StandingsGroups({groups, matchesByGroup, initialGroup}: StandingsGroupsProps): React.JSX.Element {
    const router = useRouter()
    const initial = groups.find(g => g.group === initialGroup)?.group ?? groups[0]?.group
    const [active, setActive] = useState(initial)
    const selected = groups.find(g => g.group === active) ?? groups[0]
    const matches = matchesByGroup[selected.group] ?? []

    function selectGroup(group: string): void {
        setActive(group)
        router.replace(`/app/standings?group=${encodeURIComponent(group)}`, {scroll: false})
    }

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap justify-center gap-2">
                {groups.map(g => {
                    const isActive = g.group === selected.group
                    return (
                        <button
                            key={g.group}
                            type="button"
                            onClick={() => selectGroup(g.group)}
                            aria-pressed={isActive}
                            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors ${
                                isActive
                                    ? `bg-gradient-to-br ${BRAND_GRADIENT} text-white shadow-lg shadow-cyan-500/30`
                                    : "bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                            }`}
                        >
                            {g.group}
                        </button>
                    )
                })}
            </div>

            <GroupTable group={selected.group} standings={selected.standings}/>

            <GroupMatchList group={selected.group} matches={matches}/>
        </section>
    )
}
