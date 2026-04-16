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
    const [homeScore, setHomeScore] = useState(match.prediction?.homeScore?.toString() ?? "")
    const [awayScore, setAwayScore] = useState(match.prediction?.awayScore?.toString() ?? "")
    const [isSending, setIsSending] = useState(false)
    const [savedPrediction, setSavedPrediction] = useState(
        match.prediction ? {home: match.prediction.homeScore, away: match.prediction.awayScore} : undefined,
    )

    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()

    const handleDigit = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (/^\d*$/.test(e.target.value)) setter(e.target.value)
    }

    async function submit() {
        if (homeScore === "" || awayScore === "") {
            toast.error("Enter a score for both teams")
            return
        }
        const h = Number(homeScore)
        const a = Number(awayScore)
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
        || savedPrediction.home !== Number(homeScore)
        || savedPrediction.away !== Number(awayScore)

    return (
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
            <div className="text-center md:text-left text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
                {isUpcoming ? "Predict the score" : "Your prediction"}
            </div>
            <div className="text-xs text-gray-400 mb-6 text-center md:text-left">
                <LocalTime date={match.datetime}/>
            </div>

            <div className="flex items-center justify-between gap-2">
                <TeamSide code={homeCode} name={match.homeTeam}/>
                <div className="flex items-center gap-2">
                    <ScoreInput value={homeScore} onChange={handleDigit(setHomeScore)} disabled={!isUpcoming}/>
                    <span className="text-3xl font-black text-gray-500">:</span>
                    <ScoreInput value={awayScore} onChange={handleDigit(setAwayScore)} disabled={!isUpcoming}/>
                </div>
                <TeamSide code={awayCode} name={match.awayTeam} reverse/>
            </div>

            {isUpcoming && (
                <Button
                    onPress={submit}
                    isLoading={isSending}
                    isDisabled={!hasChanges}
                    className={"mt-6 w-full " + BUTTON_CLASS}
                >
                    {savedPrediction ? "Update prediction" : "Submit prediction"}
                </Button>
            )}

            {!isUpcoming && (
                <div className="mt-6 text-center text-sm text-gray-400">
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
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    disabled: boolean
}) {
    return (
        <div className="inline-block rounded-2xl bg-gradient-to-tr from-blue-500 via-cyan-400 to-green-300 p-[2px]">
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={onChange}
                maxLength={1}
                placeholder="_"
                disabled={disabled}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-900 text-center text-3xl font-black text-white border-none outline-none disabled:opacity-80"
            />
        </div>
    )
}
