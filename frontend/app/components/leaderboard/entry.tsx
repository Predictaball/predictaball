'use client'

import React, {useState} from "react"
import {LeaderboardInner, LeaderboardInnerMovementEnum} from "@/client"
import FormBadge from "@/app/components/leaderboard/form-badge"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {NEGATIVE_CHIP, NEUTRAL_CHIP, POSITIVE_CHIP} from "@/app/util/css-classes"

interface EntryProps {
    entry: LeaderboardInner
    icon: React.JSX.Element
    disablePulse: boolean
    isUser?: boolean
    movement: LeaderboardInnerMovementEnum
    form: (number | null)[]
}

const MOVEMENT_CHIP: Record<LeaderboardInnerMovementEnum, string> = {
    IMPROVED: POSITIVE_CHIP,
    WORSENED: NEGATIVE_CHIP,
    UNCHANGED: NEUTRAL_CHIP,
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
                    ? "bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300"
                    : isPodium
                        ? "bg-gradient-to-r from-slate-900/20 to-slate-900/10 dark:from-white/25 dark:to-white/10"
                        : "bg-slate-900/10 dark:bg-white/10"
            } ${isLoading ? "animate-pulse" : "hover:scale-[1.01]"}`}
        >
            <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-gray-900/85 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center justify-center h-6 w-6 rounded-full border text-[10px] font-bold ${MOVEMENT_CHIP[props.movement]}`}>
                        {props.icon}
                    </div>
                    <div className="w-9 text-center text-lg font-black tabular-nums text-slate-900 dark:text-white">
                        {props.entry.position}
                    </div>
                </div>
                <div className="flex-1 min-w-0 text-left font-semibold text-slate-900 dark:text-white truncate">
                    {props.entry.user.firstName} {props.entry.user.familyName}
                </div>
                {/* Leaderboard rows show only the most recent game (form is most-recent-first). */}
                {props.form.length > 0 && <FormBadge form={props.form.slice(0, 1)}/>}
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex w-[22px] justify-center shrink-0">
                        {props.entry.user.supportedTeamFlagCode && (
                            <FlagImage code={props.entry.user.supportedTeamFlagCode} name={props.entry.user.supportedTeamName ?? ""} size={22}/>
                        )}
                    </div>
                    <div className="w-12 text-center font-black tabular-nums bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">
                        {props.entry.user.fixedPoints + props.entry.user.livePoints}
                    </div>
                </div>
            </div>
        </div>
    )
}
