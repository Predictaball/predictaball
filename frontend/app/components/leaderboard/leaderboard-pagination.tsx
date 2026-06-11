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
    // Pad short pages (i.e. the last one) up to a full page of rows so the
    // document height never changes between pages. A changing height makes the
    // browser clamp the scroll position, which reads as the list "jumping".
    const fillerCount = paginated ? Math.max(itemsPerPage - pageEntries.length, 0) : 0

    return <>
        {pageEntries.map((entry, index) => (
            <LeaderboardEntry
                key={index}
                entry={entry}
                isUser={entry.user.userId === props.userId}
                disablePulse={false}
                form={props.formByUserId[entry.user.userId] ?? []}
            />
        ))}
        {Array.from({length: fillerCount}).map((_, i) => (
            // Invisible row that matches an entry's height exactly, keeping every
            // page the same height. aria-hidden + inert so it's inert to AT/focus.
            <div key={`filler-${i}`} aria-hidden inert className="invisible w-full max-w-2xl rounded-2xl p-[1px] mb-2.5">
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                    <div className="text-lg font-black">0</div>
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
