'use client'

import React, {useState} from "react"
import {LeaderboardInner, LeaderboardInnerMovementEnum} from "@/client"

interface EntryProps {
    entry: LeaderboardInner
    icon: React.JSX.Element
    disablePulse: boolean
    isUser?: boolean
    movement: LeaderboardInnerMovementEnum
}

const MOVEMENT_CHIP: Record<LeaderboardInnerMovementEnum, string> = {
    IMPROVED: "bg-green-500/15 text-green-700 border-green-500/30 dark:bg-green-400/15 dark:text-green-300 dark:border-green-400/30",
    WORSENED: "bg-red-500/15 text-red-700 border-red-500/30 dark:bg-red-400/15 dark:text-red-300 dark:border-red-400/30",
    UNCHANGED: "bg-slate-900/5 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
}

export default function Entry(props: EntryProps): React.JSX.Element {
    const [isLoading, setIsLoading] = useState(false)

    const isPodium = props.entry.position <= 3
    const isUser = props.isUser ?? false

    return (
        <div
            onClick={() => setIsLoading(!props.disablePulse)}
            className={`group relative w-full max-w-2xl rounded-2xl p-[1px] mb-2.5 transition-transform ${
                isUser
                    ? "bg-gradient-to-r from-blue-500 via-cyan-400 to-green-300"
                    : isPodium
                        ? "bg-gradient-to-r from-slate-900/20 to-slate-900/10 dark:from-white/25 dark:to-white/10"
                        : "bg-slate-900/10 dark:bg-white/10"
            } ${isLoading ? "animate-pulse" : "hover:scale-[1.01]"}`}
        >
            <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-gray-900/85 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center justify-center w-10 text-lg font-black tabular-nums text-slate-900 dark:text-white">
                    {props.entry.position}
                </div>
                <div className={`flex items-center justify-center h-6 w-6 rounded-full border text-[10px] font-bold ${MOVEMENT_CHIP[props.movement]}`}>
                    {props.icon}
                </div>
                <div className="flex-1 min-w-0 text-left font-semibold text-slate-900 dark:text-white truncate">
                    {props.entry.user.firstName} {props.entry.user.familyName}
                </div>
                <div className="font-black tabular-nums bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 dark:from-blue-400 dark:via-cyan-300 dark:to-green-300 bg-clip-text text-transparent">
                    {props.entry.user.fixedPoints + props.entry.user.livePoints}
                </div>
            </div>
        </div>
    )
}
