'use client'

import React, {useRef, useState} from "react"
import {Button} from "@nextui-org/react"
import toast from "react-hot-toast"
import {Match, MatchStateEnum} from "@/client"
import {BUTTON_CLASS} from "@/app/util/css-classes"
import {handlePrediction} from "@/app/components/ticket/submit-prediction"
import {FlagImage} from "@/app/components/predictions/flag-image"
import {SHORT_COUNTRY_NAMES} from "@/app/util/teams"

const ADVANCE_DELAY_MS = 800
const SWIPE_STEP_PX = 34

function vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern)
    }
}

interface PredictionFormProps {
    match: Match
    onPredictionSaved: () => void
}

export default function PredictionForm({match, onPredictionSaved}: PredictionFormProps): React.JSX.Element {
    const isUpcoming = match.state === MatchStateEnum.Upcoming
    const [homeScore, setHomeScore] = useState<number>(match.prediction?.homeScore ?? 0)
    const [awayScore, setAwayScore] = useState<number>(match.prediction?.awayScore ?? 0)
    const [isSending, setIsSending] = useState(false)
    const [savedPrediction, setSavedPrediction] = useState(
        match.prediction ? {home: match.prediction.homeScore, away: match.prediction.awayScore} : undefined,
    )

    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()

    async function submit() {
        const h = homeScore
        const a = awayScore
        setIsSending(true)
        try {
            await handlePrediction(h, a, match.matchId)
            setSavedPrediction({home: h, away: a})
            vibrate([20, 40, 20])
            toast.success("Prediction saved")
            setTimeout(onPredictionSaved, ADVANCE_DELAY_MS)
        } catch {
            toast.error("Couldn't save prediction — try again")
        } finally {
            setIsSending(false)
        }
    }

    const hasChanges = savedPrediction === undefined
        || savedPrediction.home !== homeScore
        || savedPrediction.away !== awayScore

    return (
        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center">
            <div className="lg:pb-4 sm:pb-2 lg:font-bold text-center md:text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400 mb-1">
                {isUpcoming ? "Predict the score" : "Your prediction"}
            </div>

            <div className="flex items-center justify-between gap-2">
                <TeamSide code={homeCode} name={match.homeTeam}/>
                <div className="flex items-center gap-2">
                    <ScoreInput value={homeScore} onChange={setHomeScore} disabled={!isUpcoming}/>
                    <span className="text-3xl font-black text-slate-400 dark:text-gray-500">:</span>
                    <ScoreInput value={awayScore} onChange={setAwayScore} disabled={!isUpcoming}/>
                </div>
                <TeamSide code={awayCode} name={match.awayTeam} reverse/>
            </div>

            {isUpcoming && (
                <Button
                    onPress={submit}
                    isLoading={isSending}
                    isDisabled={!hasChanges}
                    className={"mt-4 w-full " + BUTTON_CLASS}
                >
                    {savedPrediction ? "Update prediction" : "Submit Prediction"}
                </Button>
            )}

            {!isUpcoming && (
                <div className="mt-4 text-center text-sm text-slate-500 dark:text-gray-400">
                    {match.state === MatchStateEnum.Live
                        ? `Live score: ${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                        : `Final: ${match.homeScore ?? 0} - ${match.awayScore ?? 0}`}
                </div>
            )}
        </div>
    )
}

function TeamSide({code, name, reverse}: {code: string; name: string; reverse?: boolean}) {
    const displayName = SHORT_COUNTRY_NAMES[name.toLowerCase()] ?? name
    return (
        <div className={`flex flex-col items-center gap-2 w-20 ${reverse ? "order-last" : ""}`}>
            <FlagImage code={code} name={name} size={48}/>
            <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-gray-200 text-center leading-tight break-words w-full">
                {displayName}
            </span>
        </div>
    )
}

function ScoreInput({value, onChange, disabled}: {
    value: number
    onChange: (v: number) => void
    disabled: boolean
}) {
    const btnClass = "w-full h-8 rounded-lg bg-slate-900/5 border border-slate-900/10 text-cyan-600 hover:bg-slate-900/10 hover:border-cyan-500/40 dark:bg-white/5 dark:border-white/10 dark:text-cyan-300 dark:hover:bg-white/10 dark:hover:border-cyan-400/40 font-bold text-base flex items-center justify-center active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none select-none"
    const dragRef = useRef<{startY: number; startValue: number; lastValue: number} | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    function clamp(n: number): number {
        return Math.max(0, Math.min(9, n))
    }

    function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (disabled) return
        dragRef.current = {startY: e.clientY, startValue: value, lastValue: value}
        e.currentTarget.setPointerCapture(e.pointerId)
        setIsDragging(true)
    }

    function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        const drag = dragRef.current
        if (!drag) return
        const delta = Math.round((drag.startY - e.clientY) / SWIPE_STEP_PX)
        const next = clamp(drag.startValue + delta)
        if (next !== drag.lastValue) {
            drag.lastValue = next
            vibrate(6)
            onChange(next)
        }
    }

    function endDrag(e: React.PointerEvent<HTMLDivElement>) {
        if (!dragRef.current) return
        dragRef.current = null
        setIsDragging(false)
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
    }

    return (
        <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
            <button type="button" disabled={disabled || value >= 9} onClick={() => onChange(value + 1)} className={btnClass}>
                +
            </button>
            <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{touchAction: "none"}}
                className={`w-full rounded-2xl bg-gradient-to-tr from-blue-500 via-cyan-400 to-green-300 p-[2px] transition-transform ${isDragging ? "scale-105" : ""} ${disabled ? "" : "cursor-ns-resize"}`}
            >
                <div className="w-full aspect-square rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-3xl font-black text-slate-900 dark:text-white select-none">
                    {value}
                </div>
            </div>
            <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className={btnClass}>
                −
            </button>
        </div>
    )
}
