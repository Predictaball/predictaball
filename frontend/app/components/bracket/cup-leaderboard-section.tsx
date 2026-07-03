'use client'

import React from "react"
import SectionHeading from "@/app/components/section-heading"
import CupLeaderboard from "@/app/components/bracket/cup-leaderboard"
import { fetchBracketLeaderboard } from "@/app/components/bracket/fetch-leaderboard"
import { BracketLeaderboardRow } from "@/client"

interface CupTab {
    id: string
    name: string
}

interface CupLeaderboardSectionProps {
    tabs: CupTab[]
    initialLeagueId: string
    initialRows: BracketLeaderboardRow[] | null
    currentUserId?: string
}

// Client-side league switcher for the Knockout Cup. Switching league fetches
// just the leaderboard (via the fetchBracketLeaderboard server action) and
// swaps it in place, so the bracket and score header above don't reload.
export default function CupLeaderboardSection({
    tabs,
    initialLeagueId,
    initialRows,
    currentUserId,
}: CupLeaderboardSectionProps): React.JSX.Element {
    const [leagueId, setLeagueId] = React.useState(initialLeagueId)
    const [rows, setRows] = React.useState<BracketLeaderboardRow[] | null>(initialRows)
    const [isPending, startTransition] = React.useTransition()

    function selectLeague(nextLeagueId: string): void {
        if (nextLeagueId === leagueId) return
        setLeagueId(nextLeagueId)

        // Keep the URL shareable without triggering a navigation/refresh.
        const url = new URL(window.location.href)
        url.searchParams.set("leagueId", nextLeagueId)
        window.history.replaceState(window.history.state, "", url)

        startTransition(async () => {
            setRows(await fetchBracketLeaderboard(nextLeagueId))
        })
    }

    return (
        <section className="space-y-3">
            <SectionHeading title="Knockout Cup" />
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                    const active = tab.id === leagueId
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => selectLeague(tab.id)}
                            aria-pressed={active}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                                active
                                    ? "bg-pitch-600/15 text-pitch-700 ring-1 ring-pitch-600/40 dark:text-pitch-300"
                                    : "bg-slate-900/5 text-slate-500 hover:bg-slate-900/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                            }`}
                        >
                            {tab.name}
                        </button>
                    )
                })}
            </div>
            <div className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
                {rows
                    ? <CupLeaderboard rows={rows} currentUserId={currentUserId} />
                    : (
                        <div className="rounded-2xl border border-dashed border-slate-900/15 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-gray-400">
                            Couldn&apos;t load the Knockout Cup right now. Please try again shortly.
                        </div>
                    )}
            </div>
        </section>
    )
}
