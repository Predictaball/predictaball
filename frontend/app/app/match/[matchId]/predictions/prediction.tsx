'use client'

import React from "react";
import Link from "next/link";
import {Match, PredictionWithUser} from "@/client";
import {FlagImage} from "@/app/components/predictions/flag-image";
import {generateHistoryPageLinkForUser} from "@/app/app/user/[userId]/history/user-link-generator";
import {ChipBadge, chipDisplay, NudgeScore} from "@/app/components/predictions/chip-impact";
import {PODIUM_ROW} from "@/app/util/css-classes";

export default function PredictionWithLink(props: {
    predictionWithUser: PredictionWithUser
    match: Match
    position: number
    isUser?: boolean
}): React.JSX.Element {
    const {user, prediction} = props.predictionWithUser
    const isUser = props.isUser ?? false
    const isPodium = props.position <= 3
    const display = chipDisplay(prediction, props.match)

    return (
        <Link className="block max-w-2xl w-full" href={generateHistoryPageLinkForUser(user)}>
            <div
                className={`group relative w-full border-l-[3px] border-b border-b-slate-200 dark:border-b-white/10 transition-colors hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04] ${
                    isUser
                        ? "border-l-pitch-600 bg-pitch-600/10 dark:border-l-pitch-400 dark:bg-pitch-400/10"
                        : isPodium
                            ? PODIUM_ROW[props.position as 1 | 2 | 3]
                            : "border-l-transparent"
                }`}
            >
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex items-center justify-center w-7 font-display text-lg font-black tabular-nums text-slate-900 dark:text-white">
                        {props.position}
                    </div>
                    {user.supportedTeamFlagCode && (
                        <FlagImage code={user.supportedTeamFlagCode} name={user.supportedTeamName ?? ""} size={22}/>
                    )}
                    <div className="flex-1 min-w-0 text-left font-semibold text-slate-900 dark:text-white truncate">
                        {user.firstName} {user.familyName}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {display.predictionBadge && <ChipBadge {...display.predictionBadge}/>}
                        {display.nudge ? (
                            <NudgeScore original={display.nudge.original} adjusted={display.nudge.adjusted} className="text-sm font-bold"/>
                        ) : (
                            <span className="text-sm font-bold tabular-nums text-slate-500 dark:text-gray-400">
                                {prediction.homeScore}<span className="px-1 text-slate-300 dark:text-gray-600">-</span>{prediction.awayScore}
                            </span>
                        )}
                    </div>
                    {display.pointsBadge && <ChipBadge {...display.pointsBadge}/>}
                    {prediction.points !== undefined && (
                        <div className="w-7 text-right text-lg font-black tabular-nums text-pitch-700 dark:text-pitch-300">
                            {prediction.points}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
