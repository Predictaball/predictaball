'use client'

import React, {useState} from "react"
import {Button} from "@nextui-org/react"
import toast from "react-hot-toast"
import {Match, MatchStateEnum} from "@/client"
import {BUTTON_CLASS} from "@/app/util/css-classes"
import {handlePrediction} from "@/app/components/ticket/submit-prediction"
import {LocalTime} from "@/app/components/ticket/local-time"
import {FlagImage} from "@/app/components/predictions/flag-image"

const ADVANCE_DELAY_MS = 800

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
            <div className="text-center md:text-left text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
                {isUpcoming ? "Predict the score" : "Your prediction"}
            </div>
            <div className="text-xs text-gray-400 mb-4 text-center md:text-left">
                <LocalTime date={match.datetime}/>
            </div>

            <div className="flex items-center justify-between gap-2">
                <TeamSide code={homeCode} name={match.homeTeam}/>
                <div className="flex items-center gap-2">
                    <ScoreInput value={homeScore} onChange={setHomeScore} disabled={!isUpcoming}/>
                    <span className="text-3xl font-black text-gray-500">:</span>
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
                    {savedPrediction ? "Update prediction" : "Submit prediction"}
                </Button>
            )}

            {!isUpcoming && (
                <div className="mt-4 text-center text-sm text-gray-400">
                    {match.state === MatchStateEnum.Live
                        ? `Live score: ${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                        : `Final: ${match.homeScore ?? 0} - ${match.awayScore ?? 0}`}
                </div>
            )}
        </div>
    )
}

function TeamSide({code, name, reverse}: {code: string; name: string; reverse?: boolean}) {
    return (
        <div className={`flex flex-col items-center gap-2 w-20 ${reverse ? "order-last" : ""}`}>
            <FlagImage code={code} name={name} size={48}/>
            <span className="text-xs font-semibold tracking-wide text-gray-200 text-center truncate w-full">
                {name}
            </span>
        </div>
    )
}

function ScoreInput({value, onChange, disabled}: {
    value: number
    onChange: (v: number) => void
    disabled: boolean
}) {
    const btnClass = "w-full h-8 rounded-lg bg-white/5 border border-white/10 text-cyan-300 font-bold text-base flex items-center justify-center hover:bg-white/10 hover:border-cyan-400/40 active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none select-none"
    return (
        <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
            <button type="button" disabled={disabled || value >= 9} onClick={() => onChange(value + 1)} className={btnClass}>
                +
            </button>
            <div className="w-full rounded-2xl bg-gradient-to-tr from-blue-500 via-cyan-400 to-green-300 p-[2px]">
                <div className="w-full aspect-square rounded-2xl bg-gray-900 flex items-center justify-center text-3xl font-black text-white">
                    {value}
                </div>
            </div>
            <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className={btnClass}>
                −
            </button>
        </div>
    )
}
