'use client'

import React, {useState} from "react";
import {Match, MatchStateEnum} from "@/client";
import Crest from "@/app/components/ticket/crest";
import {Button} from "@nextui-org/react";
import {BUTTON_CLASS} from "@/app/util/css-classes";
import {handlePrediction} from "./submit-prediction"
import toast from "react-hot-toast";
import {endMatch, submitScore} from "./submit-score";
import {navigateTo} from "@/app/actions";

interface EntryProps {
    match: Match,
    admin: boolean,
    forPredictionPage?: boolean
}

enum EntryState {
    UPCOMING,
    LIVE,
    LIVE_ADMIN,
    ENDED
}

const getEntryState = (matchState: MatchStateEnum, admin: boolean): EntryState => {
    switch (matchState) {
        case MatchStateEnum.Upcoming:
            return EntryState.UPCOMING
        case MatchStateEnum.Completed:
            return EntryState.ENDED
        case MatchStateEnum.Live:
            if (admin) {
                return EntryState.LIVE_ADMIN
            } else {
                return EntryState.LIVE
            }
    }
}

const getStartingValue = (prediction: number | undefined, score: number | undefined, entryState: EntryState): string => {
    switch (entryState) {
        case EntryState.LIVE_ADMIN:
            return score?.toString() ?? ""
        default:
            return prediction?.toString() ?? ""
    }
}


export default function Entry(props: EntryProps): React.JSX.Element {
    const entryState = getEntryState(props.match.state, props.admin)
    const canInput = [EntryState.UPCOMING, EntryState.LIVE_ADMIN].includes(entryState)

    const [homeScore, setHomeScore] = useState<string>(
        getStartingValue(props.match.prediction?.homeScore, props.match.homeScore, entryState)
    )
    const [awayScore, setAwayScore] = useState<string>(
        getStartingValue(props.match.prediction?.awayScore, props.match.awayScore, entryState)
    )
    const [isSending, setIsSending] = useState<boolean>(false)
    const [predictionSetSuccess, setPredictionSetSuccess] = useState(false)
    const [isEnding, setIsEnding] = useState(false)
    const [ended, setEnded] = useState(false)
    const [isNavigatingToMatchPage, setIsNavigatingToMatchPage] = useState(false)

    function handleHomeScore(event: React.ChangeEvent<HTMLInputElement>) {
        if (/^\d*$/.test(event.target.value)) { // Only allow digits
            setHomeScore(event.target.value)
        }
    }

    function handleAwayScore(event: React.ChangeEvent<HTMLInputElement>) {
        if (/^\d*$/.test(event.target.value)) { // Only allow digits
            setAwayScore(event.target.value)
        }
    }

    const validateInputs = (): boolean => {
        if (homeScore === undefined || awayScore === undefined || homeScore === "" || awayScore === "") {
            toast.error("You need to enter a score for both teams")
            return false
        }

        const homeScoreAsNumber = Number(homeScore)
        const awayScoreAsNumber = Number(awayScore)
        if (isNaN(homeScoreAsNumber) || isNaN(awayScoreAsNumber)) {
            toast.error("You must enter a number")
            return false
        }
        return true
    }

    async function handleEndMatch(): Promise<void> {
        if (!validateInputs()) return
        if (ended) return

        const homeScoreAsNumber = Number(homeScore)
        const awayScoreAsNumber = Number(awayScore)

        const shouldContinue = confirm(`Are you sure you want to end the match with score ${homeScoreAsNumber} - ${awayScoreAsNumber}`)
        if (!shouldContinue) return

        setIsEnding(true)
        try {
            await endMatch(homeScoreAsNumber, awayScoreAsNumber, props.match.matchId)
            toast.success("Ended match successfully")
            setEnded(true)
            setIsEnding(false)
        } catch (error) {
            toast.error("Error Sending Prediction, try again")
            setPredictionSetSuccess(false)
        } finally {
            setIsEnding(false);
        }
    }

    async function handleSubmit(): Promise<void> {
        if (!validateInputs()) return


        const homeScoreAsNumber = Number(homeScore)
        const awayScoreAsNumber = Number(awayScore)

        setIsSending(true)
        try {
            switch (entryState) {
                case EntryState.UPCOMING:
                    await handlePrediction(homeScoreAsNumber, awayScoreAsNumber, props.match.matchId);
                    break
                case EntryState.LIVE_ADMIN:
                    await submitScore(homeScoreAsNumber, awayScoreAsNumber, props.match.matchId)
                    break
                default:
                    throw new Error("Should not be able to submit in current state")
            }
            setPredictionSetSuccess(true)
        } catch (error) {
            toast.error("Error Sending Prediction, try again")
            setPredictionSetSuccess(false)
        } finally {
            setIsSending(false);
        }
    }

    function getPredictionOrSubmitButton(entryState: EntryState) {
        switch (entryState) {
            case EntryState.LIVE:
            case EntryState.ENDED:
                return !props.forPredictionPage && (
                    <>
                        <div className="text-center">
                            <p className="text-white text-sm">
                                {(entryState === EntryState.LIVE ? "Live" : "Final") + " Score"}
                            </p>
                            <p className="text-white text-sm">
                                {props.match.homeScore} - {props.match.awayScore}
                            </p>
                        </div>
                        <div className="mt-2">
                            <Button className={BUTTON_CLASS}
                                    isLoading={isNavigatingToMatchPage}
                                    size="sm"
                                    onClick={() => {
                                        setIsNavigatingToMatchPage(true)
                                        navigateTo(`app/match/${props.match.matchId}/predictions`)
                                    }}
                            >
                                View Predictions
                            </Button>
                        </div>
                    </>
                )
            case EntryState.UPCOMING:
                return (
                    <Button
                        onClick={() => handleSubmit()} isLoading={isSending}
                        style={{height: "25px"}}
                        className={BUTTON_CLASS}
                    >
                        {props.match.prediction !== undefined || predictionSetSuccess ? "Update" : "Submit"}
                    </Button>
                )
            case EntryState.LIVE_ADMIN:
                return (
                    <>
                        <Button
                            onClick={() => handleSubmit()}
                            isLoading={isSending}
                            style={{height: "25px"}}
                            className={"mt-1 " + BUTTON_CLASS}
                            disabled={ended}
                        >
                            Update Score
                        </Button>
                        <Button
                            color="danger"
                            className="mt-3"
                            style={{height: "25px"}}
                            onPress={handleEndMatch}
                            isLoading={isEnding}
                            disabled={ended}
                        >
                            End Match
                        </Button>
                    </>

                )
        }
    }

    return (
        <div className="flex items-center">
            <div className="flex justify-around items-center" style={{width: "33.3%", height: "80px"}}>
                <Crest country={props.match.homeTeam} flagCode={props.match.homeTeamFlagCode} large={props.match.state !== MatchStateEnum.Upcoming}/>
            </div>
            <div className="flex flex-col justify-center items-center" style={{width: "33.3%"}}>
                <div className="flex space-x-4 p-1 justify-around items-center">
                    <div className="inline-block rounded-full bg-gradient-to-tr from-[#10abff] to-[#1beabd] p-[3px] text-2xl">
                        <input
                            type="text" inputMode="numeric" pattern="[0-9]*"
                            value={props.forPredictionPage 
                                ? props.match.homeScore 
                                : (canInput ? homeScore : props.match.prediction?.homeScore)}
                            onChange={handleHomeScore}
                            maxLength={1}
                            placeholder={"_"}
                            disabled={!canInput}
                            className="w-[50px] h-[50px] rounded-full bg-[#102C4C] text-center text-white border-none outline-none"
                        />
                    </div>
                    <div className="inline-block rounded-full bg-gradient-to-tr from-[#10abff] to-[#1beabd] p-[3px] text-2xl">
                        <input type="text" inputMode="numeric" pattern="[0-9]*"
                               value={
                                props.forPredictionPage 
                                ? props.match.awayScore
                                : (canInput ? awayScore : props.match.prediction?.awayScore)}
                               onChange={handleAwayScore}
                               maxLength={1}
                               placeholder={"_"}
                               disabled={!canInput}
                               className="w-[50px] h-[50px] rounded-full bg-[#102C4C] text-center text-white border-none outline-none"
                        />
                    </div>
                </div>
                <div>
                    {getPredictionOrSubmitButton(entryState)}
                </div>
            </div>
            <div className="flex justify-around items-center" style={{width: "33.3%", height: "80px"}}>
                <Crest country={props.match.awayTeam} flagCode={props.match.awayTeamFlagCode} large={props.match.state !== MatchStateEnum.Upcoming}/>
            </div>
        </div>
    )
}