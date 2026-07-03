'use client'

import React, { useEffect, useState } from "react"
import { BracketLeaderboardRow } from "@/client"
import Pagination from "@/app/components/pagination"
import useWindowDimensions from "@/app/hooks/use-window-dimension"
import { PODIUM_ROW } from "@/app/util/css-classes"

interface CupLeaderboardProps {
    rows: BracketLeaderboardRow[]
    currentUserId?: string
}

/** A single cup standing, styled to match the app's main leaderboard rows. */
function CupEntry({ row, isYou }: { row: BracketLeaderboardRow; isYou: boolean }): React.JSX.Element {
    const isPodium = row.position <= 3

    return (
        <div
            className={`relative w-full max-w-2xl border-l-[3px] border-b border-b-slate-200 dark:border-b-white/10 ${
                isYou
                    ? "border-l-pitch-600 bg-pitch-600/10 dark:border-l-pitch-400 dark:bg-pitch-400/10"
                    : isPodium
                        ? PODIUM_ROW[row.position as 1 | 2 | 3]
                        : "border-l-transparent"
            }`}
        >
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 text-center font-display text-lg font-black tabular-nums text-slate-900 dark:text-white shrink-0">
                    {row.position}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
                    <span className="truncate font-semibold text-slate-900 dark:text-white">
                        {row.firstName} {row.familyName}
                    </span>
                    {isYou && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-pitch-700 dark:text-pitch-300">you</span>
                    )}
                    {row.isCupHolder && (
                        <span title="Knockout Cup holder" aria-label="Knockout Cup holder">🏆</span>
                    )}
                </div>
                <div className="w-12 text-center font-display text-lg font-black tabular-nums text-pitch-700 dark:text-pitch-300 shrink-0">
                    {row.totalPoints}
                </div>
            </div>
        </div>
    )
}

/** League standings for the Knockout Cup; the leader(s) carry the trophy. */
export default function CupLeaderboard({ rows, currentUserId }: CupLeaderboardProps): React.JSX.Element {
    const [currentPage, setCurrentPage] = useState(0)
    const windowSize = useWindowDimensions()
    // Match the main leaderboard's viewport-derived page size so the two feel alike.
    const itemsPerPage = windowSize.height !== undefined ? Math.max(Math.round(windowSize.height / 100) - 1, 1) : 10
    const totalPages = Math.ceil(rows.length / itemsPerPage)

    // Reset to the first page when the standings change (e.g. switching league).
    useEffect(() => {
        setCurrentPage(0)
    }, [rows])

    // Keep the active page in range if the viewport (and therefore page size) shrinks.
    useEffect(() => {
        if (currentPage > totalPages - 1) {
            setCurrentPage(Math.max(totalPages - 1, 0))
        }
    }, [currentPage, totalPages])

    if (rows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-900/15 dark:border-white/15 p-8 text-center text-sm text-slate-500 dark:text-gray-400">
                No cup scores yet — points land as the knockout matches are played.
            </div>
        )
    }

    const paginated = totalPages > 1
    const startIndex = currentPage * itemsPerPage
    const pageRows = paginated ? rows.slice(startIndex, startIndex + itemsPerPage) : rows
    // Pad short pages (i.e. the last one) up to a full page of rows so the
    // document height never changes between pages and the list never "jumps".
    const fillerCount = paginated ? Math.max(itemsPerPage - pageRows.length, 0) : 0

    return (
        <div className="flex w-full flex-col items-center">
            {pageRows.map((row) => (
                <CupEntry key={row.userId} row={row} isYou={row.userId === currentUserId} />
            ))}
            {Array.from({ length: fillerCount }).map((_, i) => (
                // Invisible row matching an entry's height, keeping every page the same height.
                <div key={`filler-${i}`} aria-hidden inert className="invisible w-full max-w-2xl border-l-[3px] border-b border-l-transparent">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="font-display text-lg font-black">0</div>
                    </div>
                </div>
            ))}
            {paginated && (
                <div className="flex justify-center pt-2">
                    <Pagination
                        page={currentPage + 1}
                        total={totalPages}
                        onChange={(page) => setCurrentPage(page - 1)}
                    />
                </div>
            )}
        </div>
    )
}
