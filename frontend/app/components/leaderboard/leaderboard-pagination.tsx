'use client'

import {LeaderboardInner} from "@/client"
import LeaderboardEntry from "./leaderboard-entry"
import React, {useEffect, useState} from "react"
import Pagination from "@/app/components/pagination"
import useWindowDimensions from "@/app/hooks/use-window-dimension";

interface LeaderboardPaginationProps {
    leaderboardInners: LeaderboardInner[]
    userId: string | undefined
    shouldPaginate: boolean
    // The limited view (main /app page) pins the leader then a window around the
    // user; only there do we mark the ranking gap with a divider.
    limit: boolean
    formByUserId: Record<string, (number | null)[]>
}

export default function LeaderboardPagination(props: LeaderboardPaginationProps): React.JSX.Element {

    const [currentPage, setCurrentPage] = useState(0)
    const windowsSize = useWindowDimensions()
    const itemsPerPage = windowsSize.height !== undefined ? Math.max((Math.round(windowsSize.height / 100)) - 1, 1) : 10

    const getPaginatedLeaderboard = (leaderboard: any[]) => {
        if (!props.shouldPaginate) {
            return leaderboard
        }
        const startIndex = currentPage * itemsPerPage;
        return leaderboard.slice(startIndex, startIndex + itemsPerPage);
    };

    const totalPages = Math.ceil(props.leaderboardInners.length / itemsPerPage);

    // Keep the active page in range if the viewport (and therefore page size) shrinks.
    useEffect(() => {
        if (currentPage > totalPages - 1) {
            setCurrentPage(Math.max(totalPages - 1, 0))
        }
    }, [currentPage, totalPages])

    const handlePageChange = (page: number) => {
        setCurrentPage(page - 1);
    };

    const paginated = props.shouldPaginate && totalPages > 1
    const pageEntries = getPaginatedLeaderboard(props.leaderboardInners)
    // On the limited view the leader is pinned, then a window around the user.
    // When that window doesn't start at 2nd place, mark the gap with a divider.
    const showLeaderBreak = props.limit
        && pageEntries.length > 1
        && pageEntries[0].position === 1
        && pageEntries[1].position > 2
    // Pad short pages (i.e. the last one) up to a full page of rows so the
    // document height never changes between pages. A changing height makes the
    // browser clamp the scroll position, which reads as the list "jumping".
    const fillerCount = paginated ? Math.max(itemsPerPage - pageEntries.length, 0) : 0

    return <>
        {pageEntries.map((entry, index) => (
            <React.Fragment key={index}>
                {showLeaderBreak && index === 1 && (
                    <div aria-hidden className="w-full max-w-2xl py-1.5 flex items-center gap-2 px-4 text-slate-300 dark:text-gray-600">
                        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10"/>
                        <span className="text-lg font-black leading-none tracking-widest">⋯</span>
                        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10"/>
                    </div>
                )}
                <LeaderboardEntry
                    entry={entry}
                    isUser={entry.user.userId === props.userId}
                    disablePulse={false}
                    form={props.formByUserId[entry.user.userId] ?? []}
                />
            </React.Fragment>
        ))}
        {Array.from({length: fillerCount}).map((_, i) => (
            // Invisible row that matches an entry's height exactly, keeping every
            // page the same height. aria-hidden + inert so it's inert to AT/focus.
            <div key={`filler-${i}`} aria-hidden inert className="invisible w-full max-w-2xl border-l-[3px] border-b border-l-transparent">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="font-display text-lg font-black">0</div>
                </div>
            </div>
        ))}
        {paginated && <>
            {/* Reserve room so the last row is never hidden behind the fixed control. */}
            <div className="h-20"/>
            <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center pointer-events-none">
                <Pagination
                    page={currentPage + 1}
                    total={totalPages}
                    onChange={handlePageChange}
                    className="pointer-events-auto"
                />
            </div>
        </>}
    </>
}
