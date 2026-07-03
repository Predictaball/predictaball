'use client'

import React, {useState} from "react"
import {LeaderboardInner, LeaderboardInnerMovementEnum} from "@/client"
import FormBadge from "@/app/components/leaderboard/form-badge"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {PODIUM_ROW} from "@/app/util/css-classes"

interface EntryProps {
    entry: LeaderboardInner
    icon: React.JSX.Element
    disablePulse: boolean
    isUser?: boolean
    movement: LeaderboardInnerMovementEnum
    form: (number | null)[]
}

// Newspaper league-table movement: a plain coloured arrow, green up, red down.
const MOVEMENT_TEXT: Record<LeaderboardInnerMovementEnum, string> = {
    IMPROVED: "text-emerald-600 dark:text-emerald-400",
    WORSENED: "text-rose-600 dark:text-rose-400",
    UNCHANGED: "text-slate-400 dark:text-gray-500",
}

/**
 * A league-table row, newspaper back-page style: flush rows split by hairline
 * rules, tabular numerals, and a solid left rule marking the podium places and
 * the signed-in user — no glows, no glass.
 */
export default function Entry(props: EntryProps): React.JSX.Element {
    const [isLoading, setIsLoading] = useState(false)

    const isPodium = props.entry.position <= 3
    const isUser = props.isUser ?? false

    return (
        <div
            onClick={() => setIsLoading(!props.disablePulse)}
            className={`group relative w-full max-w-2xl border-l-[3px] border-b border-b-slate-200 dark:border-b-white/10 transition-colors ${
                isUser
                    ? "border-l-pitch-600 bg-pitch-600/10 dark:border-l-pitch-400 dark:bg-pitch-400/10"
                    : isPodium
                        ? PODIUM_ROW[props.entry.position as 1 | 2 | 3]
                        : "border-l-transparent"
            } ${isLoading ? "animate-pulse" : "hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]"}`}
        >
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center justify-center h-6 w-5 text-xs font-bold ${MOVEMENT_TEXT[props.movement]}`}>
                        {props.icon}
                    </div>
                    <div className="w-9 text-center font-display text-lg font-black tabular-nums text-slate-900 dark:text-white">
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
                    <div className="w-12 text-center font-display text-lg font-black tabular-nums text-pitch-700 dark:text-pitch-300">
                        {props.entry.user.fixedPoints + props.entry.user.livePoints}
                    </div>
                </div>
            </div>
        </div>
    )
}
