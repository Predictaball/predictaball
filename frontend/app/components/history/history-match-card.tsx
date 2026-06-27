import React from "react"
import Link from "next/link"
import {Match, MatchRoundEnum, MatchStateEnum} from "@/client"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {LocalTime} from "@/app/components/predictions/local-time"
import {ChipBadge, chipDisplay, NudgeScore, PointsPill} from "@/app/components/predictions/chip-impact"

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_THIRTY_TWO: "Round of 32",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
    THIRD_PLACE_PLAYOFF: "Third-Place Playoff",
    FINAL: "Final",
}

export default function HistoryMatchCard({match}: {match: Match}): React.JSX.Element {
    const live = match.state === MatchStateEnum.Live
    const prediction = match.prediction
    const points = prediction?.points
    const display = chipDisplay(prediction, match)

    return (
        <Link
            href={`/app/match/${match.matchId}/predictions`}
            className="block w-full max-w-lg rounded-2xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-xl shadow-slate-900/5 dark:shadow-cyan-500/5 transition-transform hover:scale-[1.01]"
        >
            <div className="rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3.5 sm:px-5">
                <div className="relative">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400">
                        {live ? (
                            <span className="inline-flex items-center gap-1.5 text-red-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"/> Live
                            </span>
                        ) : ROUND_LABEL[match.round]}
                    </span>
                    <span className="text-slate-400 dark:text-gray-500">
                        <LocalTime date={match.datetime}/>
                    </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                        <FlagImage code={match.homeTeamFlagCode.toLowerCase()} name={match.homeTeam} size={32}/>
                        <span className="text-sm font-bold capitalize text-slate-700 dark:text-gray-200 truncate">{match.homeTeam}</span>
                    </div>
                    <div className="shrink-0 w-16"/>
                    <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                        <span className="text-sm font-bold capitalize text-slate-700 dark:text-gray-200 truncate text-right">{match.awayTeam}</span>
                        <FlagImage code={match.awayTeamFlagCode.toLowerCase()} name={match.awayTeam} size={32}/>
                    </div>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">{live ? "Live" : "Result"}</span>
                    <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-white leading-tight">
                        {match.homeScore ?? "–"}<span className="px-1.5 text-slate-300 dark:text-gray-600">-</span>{match.awayScore ?? "–"}
                    </div>
                </div>
                </div>

                <div className="mt-3 grid grid-cols-3 items-center border-t border-slate-900/5 dark:border-white/5 pt-2.5">
                    <div/>
                    <div className="flex flex-col items-center">
                        {prediction ? (
                            <>
                                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">Prediction</span>
                                <div className="relative leading-tight">
                                    {display.nudge ? (
                                        <NudgeScore original={display.nudge.original} adjusted={display.nudge.adjusted} className="text-base font-bold"/>
                                    ) : (
                                        <span className="text-base font-bold tabular-nums text-slate-700 dark:text-gray-200">
                                            {prediction.homeScore}<span className="px-1 text-slate-300 dark:text-gray-600">-</span>{prediction.awayScore}
                                        </span>
                                    )}
                                    {display.predictionBadge && (
                                        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-1.5">
                                            <ChipBadge {...display.predictionBadge}/>
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <span className="text-[11px] text-slate-400 dark:text-gray-500">No prediction</span>
                        )}
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                        {display.pointsBadge && <ChipBadge {...display.pointsBadge}/>}
                        {points !== undefined && <PointsPill points={points}/>}
                    </div>
                </div>
            </div>
        </Link>
    )
}
