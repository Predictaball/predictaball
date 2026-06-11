'use client'

import React from "react";
import Link from "next/link";
import {Chip, Match, PredictionWithUser} from "@/client";
import {FlagImage} from "@/app/components/predictions/flag-image";
import {generateHistoryPageLinkForUser} from "@/app/app/user/[userId]/history/user-link-generator";
import {ChipImpactNote, computeChipImpact} from "@/app/components/predictions/chip-impact";

// Power-up glyphs, mirroring the home-page match pills.
const CHIP_GLYPH: Partial<Record<Chip, string>> = {
    [Chip.DoublePoints]: "2×",
    [Chip.OneGoalOut]: "±1",
    [Chip.Crowd]: "Crowd",
}

export default function PredictionWithLink(props: {
    predictionWithUser: PredictionWithUser
    match: Match
    position: number
    isUser?: boolean
}): React.JSX.Element {
    const {user, prediction} = props.predictionWithUser
    const isUser = props.isUser ?? false
    const isPodium = props.position <= 3
    const chipGlyph = prediction.chip !== Chip.None ? CHIP_GLYPH[prediction.chip] : undefined
    const chipImpact = computeChipImpact(prediction, props.match)

    return (
        <Link className="block max-w-2xl w-full" href={generateHistoryPageLinkForUser(user)}>
            <div
                className={`group relative w-full rounded-2xl p-[1px] mb-2.5 transition-transform hover:scale-[1.01] ${
                    isUser
                        ? "bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300"
                        : isPodium
                            ? "bg-gradient-to-r from-slate-900/20 to-slate-900/10 dark:from-white/25 dark:to-white/10"
                            : "bg-slate-900/10 dark:bg-white/10"
                }`}
            >
                <div className="rounded-2xl bg-white dark:bg-gray-900/85 backdrop-blur-sm px-4 py-3">
                    <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 text-lg font-black tabular-nums text-slate-900 dark:text-white">
                        {props.position}
                    </div>
                    {user.supportedTeamFlagCode && (
                        <FlagImage code={user.supportedTeamFlagCode} name={user.supportedTeamName ?? ""} size={22}/>
                    )}
                    <div className="flex-1 min-w-0 text-left font-semibold text-slate-900 dark:text-white truncate">
                        {user.firstName} {user.familyName}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {chipGlyph && (
                            <span className="rounded border border-cyan-500/30 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-black leading-none text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-300">
                                {chipGlyph}
                            </span>
                        )}
                        <span className="text-sm font-bold tabular-nums text-slate-500 dark:text-gray-400">
                            {prediction.homeScore}<span className="px-1 text-slate-300 dark:text-gray-600">-</span>{prediction.awayScore}
                        </span>
                    </div>
                    {prediction.points !== undefined && (
                        <div className="w-7 text-right text-lg font-black tabular-nums bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">
                            {prediction.points}
                        </div>
                    )}
                    </div>
                    {chipImpact && (
                        <div className="mt-2 pl-[2.875rem]">
                            <ChipImpactNote impact={chipImpact}/>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
