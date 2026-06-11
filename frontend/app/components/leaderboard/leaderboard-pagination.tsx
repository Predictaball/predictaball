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

    return <>
        {getPaginatedLeaderboard(props.leaderboardInners).map((entry, index) => (
            <LeaderboardEntry
                key={index}
                entry={entry}
                isUser={entry.user.userId === props.userId}
                disablePulse={false}
                form={props.formByUserId[entry.user.userId] ?? []}
            />
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
