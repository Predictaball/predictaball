'use client'

import {LeaderboardInner} from "@/client"
import LeaderboardEntry from "./leaderboard-entry"
import React, {useState} from "react"
import {Pagination} from "@nextui-org/react";
import {BUTTON_CLASS} from "@/app/util/css-classes";
import useWindowDimensions from "@/app/hooks/use-window-dimension";

interface LeaderboardPaginationProps {
    leaderboardInners: LeaderboardInner[]
    userId: string | undefined
    shouldPaginate: boolean
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page - 1);
    };

    const totalPages = Math.ceil(props.leaderboardInners.length / itemsPerPage);

    return <>
        {getPaginatedLeaderboard(props.leaderboardInners).map((entry, index) => (
            <LeaderboardEntry
                key={index}
                entry={entry}
                isUser={entry.user.userId === props.userId}
                disablePulse={false}
            />
        ))}
        {props.shouldPaginate && totalPages > 1 &&
            <Pagination showControls radius="full" total={totalPages} initialPage={1} onChange={handlePageChange}
                        className="fixed bottom-4"
                        classNames={{
                            cursor: BUTTON_CLASS,
                            item: "bg-transparent text-white hover:text-black hover:bg-white"
                        }}
            />}
    </>
}