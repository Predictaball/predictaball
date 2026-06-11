'use client'

import DistributionBar from "@/app/components/predictions/distribution-bar"
import { FlagImage } from "@/app/components/predictions/flag-image"
import type { UserChips } from "@/app/components/predictions/get-user-chips"
import { handlePrediction } from "@/app/components/predictions/submit-prediction"
import { ACTION_BUTTON_CLASS } from "@/app/util/css-classes"
import { SHORT_COUNTRY_NAMES } from "@/app/util/teams"
import { Chip, Match, MatchStateEnum } from "@/client"
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react"
import React, { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"

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
    userChips: UserChips
    onChipsChanged: (chips: UserChips) => void
    onStatusChange?: (status: {saved: boolean; hasChanges: boolean}) => void
    /** Onboarding: draw attention to the power-up selector with an explainer. */
    coachPowerUps?: boolean
    /** Onboarding: confirm with a modal if the user submits without changing the default 0-0 score. */
    confirmIfUntouched?: boolean
}

export default function PredictionForm({match, onPredictionSaved, userChips, onChipsChanged, onStatusChange, coachPowerUps, confirmIfUntouched}: PredictionFormProps): React.JSX.Element {
    const isUpcoming = match.state === MatchStateEnum.Upcoming
    const [homeScore, setHomeScore] = useState<number>(match.prediction?.homeScore ?? 0)
    const [awayScore, setAwayScore] = useState<number>(match.prediction?.awayScore ?? 0)
    const [chip, setChip] = useState<Chip>(match.prediction?.chip ?? Chip.None)
    const [isSending, setIsSending] = useState(false)
    const [justSaved, setJustSaved] = useState(false)
    const [hasTouchedScore, setHasTouchedScore] = useState(false)
    const {isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm} = useDisclosure()
    const [savedPrediction, setSavedPrediction] = useState(
        match.prediction
            ? {home: match.prediction.homeScore, away: match.prediction.awayScore, chip: match.prediction.chip}
            : undefined,
    )

    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()
    const distribution = match.predictionDistribution

    async function submit() {
        const h = homeScore
        const a = awayScore
        const c = chip
        setIsSending(true)
        try {
            const response = await handlePrediction(h, a, match.matchId, c)
            setSavedPrediction({home: h, away: a, chip: c})
            if (response) {
                onChipsChanged({
                    doublePointsRemaining: response.doublePointsChipsRemaining,
                    oneOutRemaining: response.oneOutChipsRemaining,
                    crowdRemaining: response.crowdChipsRemaining,
                })
            }
            vibrate([20, 40, 20])
            setIsSending(false)
            setJustSaved(true)
            setTimeout(() => {
                setJustSaved(false)
                onPredictionSaved()
            }, ADVANCE_DELAY_MS)
        } catch {
            toast.error("Couldn't save prediction — try again")
            setIsSending(false)
        }
    }

    function handleSubmitClick() {
        if (confirmIfUntouched && !hasTouchedScore && chip !== Chip.Crowd) {
            openConfirm()
            return
        }
        submit()
    }

    function handleHomeChange(v: number) {
        setHasTouchedScore(true)
        setHomeScore(v)
    }
    function handleAwayChange(v: number) {
        setHasTouchedScore(true)
        setAwayScore(v)
    }

    const hasChanges = savedPrediction === undefined
        || savedPrediction.home !== homeScore
        || savedPrediction.away !== awayScore
        || savedPrediction.chip !== chip

    // Surface saved/unsaved state to the panel, which renders it on the globe.
    useEffect(() => {
        onStatusChange?.({saved: savedPrediction !== undefined, hasChanges})
    }, [savedPrediction, hasChanges, onStatusChange])

    return (
        <div className="flex-1 min-w-0 p-4 sm:p-6 flex flex-col justify-center">
            <div className="hidden md:block lg:pb-4 sm:pb-2 lg:font-bold text-center md:text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400 mb-1">
                {isUpcoming ? "Predict the score" : "Your prediction"}
            </div>

            <div className="flex items-center justify-between gap-2">
                <TeamSide code={homeCode} name={match.homeTeam} ranking={match.homeTeamRanking}/>
                <div className="flex items-center gap-2">
                    <ScoreInput value={homeScore} onChange={handleHomeChange} disabled={!isUpcoming || chip === Chip.Crowd} displayOverride={chip === Chip.Crowd ? "?" : undefined}/>
                    <span className="text-3xl font-black text-slate-400 dark:text-gray-500">:</span>
                    <ScoreInput value={awayScore} onChange={handleAwayChange} disabled={!isUpcoming || chip === Chip.Crowd} displayOverride={chip === Chip.Crowd ? "?" : undefined}/>
                </div>
                <TeamSide code={awayCode} name={match.awayTeam} ranking={match.awayTeamRanking} reverse/>
            </div>

            {isUpcoming && (
                <div className="mt-1">
                    {coachPowerUps && (
                        <div className="mb-2 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                            <span aria-hidden>✨</span>
                            <span>
                                <span className="font-bold">Power-ups</span> — tap one below to bend the scoring in your favour. You get 3 of each for the whole tournament, so spend them wisely (optional).
                            </span>
                        </div>
                    )}
                    <ChipSelector
                        selected={chip}
                        onSelect={setChip}
                        chips={userChips}
                        savedChip={savedPrediction?.chip ?? Chip.None}
                    />
                </div>
            )}

            {isUpcoming && (
                <Button
                    onPress={handleSubmitClick}
                    isLoading={isSending}
                    isDisabled={!hasChanges || justSaved}
                    className={`mt-4 w-full h-11 rounded-xl transition-colors ${
                        justSaved
                            ? "bg-gradient-to-r from-cyan-400 to-teal-400 text-gray-950 font-bold shadow-lg shadow-cyan-500/25 !opacity-100"
                            : ACTION_BUTTON_CLASS
                    }`}
                >
                    {justSaved
                        ? "Saved ✓"
                        : savedPrediction ? "Update prediction" : "Submit prediction"}
                </Button>
            )}

            <Modal isOpen={isConfirmOpen} onClose={closeConfirm} placement="center" backdrop="blur" size="sm">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Predicting 0–0?</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-slate-600 dark:text-gray-300">
                                    You haven&apos;t changed the score. Tap <span className="font-bold">+</span> on either side to pick what you actually think the result will be.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>
                                    Pick a score
                                </Button>
                                <Button
                                    onPress={() => {
                                        onClose()
                                        submit()
                                    }}
                                    className={ACTION_BUTTON_CLASS}
                                >
                                    Submit 0–0
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {!isUpcoming && (
                <div className="mt-4 text-center text-sm text-slate-500 dark:text-gray-400">
                    {match.state === MatchStateEnum.Live
                        ? `Live Score: ${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                        : `Result: ${match.homeScore ?? 0} - ${match.awayScore ?? 0}`}
                </div>
            )}

            {!isUpcoming && distribution && (
                <DistributionBar distribution={distribution} homeName={match.homeTeam} awayName={match.awayTeam}/>
            )}
        </div>
    )
}

function TeamSide({code, name, reverse, ranking}: {code: string; name: string; reverse?: boolean; ranking?: number}) {
    const displayName = SHORT_COUNTRY_NAMES[name.toLowerCase()] ?? name
    return (
        <div className={`flex flex-col items-center gap-2 w-20 ${reverse ? "order-last" : ""}`}>
            <FlagImage code={code} name={name} size={48}/>
            <div className="w-full text-center leading-tight">
                <span className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-gray-200 break-words">
                    {displayName}
                </span>
                {ranking !== undefined && (
                    <span className="block text-[10px] font-medium tabular-nums text-slate-400 dark:text-gray-500 mt-0.5">
                        #{ranking}
                    </span>
                )}
            </div>
        </div>
    )
}

function ScoreInput({value, onChange, disabled, displayOverride}: {
    value: number
    onChange: (v: number) => void
    disabled: boolean
    displayOverride?: string
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
                className={`w-full rounded-2xl bg-gradient-to-tr from-blue-500 via-cyan-400 to-teal-300 p-[2px] transition-transform ${isDragging ? "scale-105" : ""} ${disabled ? "" : "cursor-ns-resize"}`}
            >
                <div className="w-full aspect-square rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-3xl font-black text-slate-900 dark:text-white select-none">
                    {displayOverride ?? value}
                </div>
            </div>
            <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className={btnClass}>
                −
            </button>
        </div>
    )
}

function ChipSelector({selected, onSelect, chips, savedChip}: {
    selected: Chip
    onSelect: (chip: Chip) => void
    chips: UserChips
    savedChip: Chip
}) {
    const options: Array<{
        value: Chip
        label: string
        glyph: string
        description: string
        remaining: number | "∞"
    }> = [
        {value: Chip.None, label: "No power-up", glyph: "—", description: "Standard scoring", remaining: "∞"},
        {value: Chip.DoublePoints, label: "Double Points", glyph: "2×", description: "Double your earned points", remaining: chips.doublePointsRemaining},
        {value: Chip.OneGoalOut, label: "Off by One", glyph: "±1", description: "Score as if one goal closer", remaining: chips.oneOutRemaining},
        {value: Chip.Crowd, label: "Follow the Crowd", glyph: "%", description: "Lock in the most popular prediction at kickoff", remaining: chips.crowdRemaining},
    ]

    const selectedOption = options.find(o => o.value === selected) ?? options[0]

    return (
        <div className="mt-3 flex items-center gap-3">
            <div className="flex gap-1.5 shrink-0">
                {options.map(option => {
                    const isSelected = selected === option.value
                    const isSavedChip = savedChip === option.value && option.value !== Chip.None
                    const outOfStock = typeof option.remaining === "number" && option.remaining <= 0 && !isSavedChip
                    const disabled = outOfStock
                    return (
                        <button
                            key={option.value}
                            type="button"
                            disabled={disabled}
                            aria-label={option.label}
                            onClick={() => onSelect(option.value)}
                            className={`relative h-10 w-10 rounded-lg flex items-center justify-center font-black text-sm transition-all border ${
                                isSelected
                                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-300 shadow-sm shadow-cyan-500/20"
                                    : "border-slate-200 bg-slate-900/[0.02] text-slate-700 hover:bg-slate-900/[0.05] hover:border-cyan-500/40 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-cyan-400/40"
                            } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
                        >
                            <span className="tabular-nums">{option.glyph}</span>
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-[9px] font-mono font-bold tabular-nums text-slate-600 dark:text-gray-300 flex items-center justify-center leading-none">
                                {option.remaining}
                            </span>
                        </button>
                    )
                })}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedOption.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">
                    {selectedOption.description}
                </div>
            </div>
        </div>
    )
}

