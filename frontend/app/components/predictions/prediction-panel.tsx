'use client'

import React, {useMemo, useRef, useState} from "react"
import {Button} from "@nextui-org/react"
import toast from "react-hot-toast"
import {Match, MatchRoundEnum, MatchStateEnum} from "@/client"
import {BUTTON_CLASS} from "@/app/util/css-classes"
import {handlePrediction} from "@/app/components/ticket/submit-prediction"
import FocusedGlobeClient from "@/app/components/flags/focused-globe-client"
import {LocalTime} from "@/app/components/ticket/local-time"

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
    FINAL: "Final",
}

interface PredictionPanelProps {
    liveMatches: Match[]
    upcomingMatches: Match[]
}

export default function PredictionPanel({liveMatches, upcomingMatches}: PredictionPanelProps): React.JSX.Element {
    const allMatches = useMemo(() => [...liveMatches, ...upcomingMatches], [liveMatches, upcomingMatches])
    const [selectedId, setSelectedId] = useState<string | undefined>(allMatches[0]?.matchId)
    const selected = allMatches.find(m => m.matchId === selectedId) ?? allMatches[0]

    if (!selected) {
        return (
            <div className="w-full max-w-5xl mx-auto my-10 rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-gray-300">
                No matches available right now. Check back soon.
            </div>
        )
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <FocusCard match={selected} key={selected.matchId}/>
            <MatchStrip
                liveMatches={liveMatches}
                upcomingMatches={upcomingMatches}
                selectedId={selected.matchId}
                onSelect={setSelectedId}
            />
        </div>
    )
}

function FocusCard({match}: {match: Match}) {
    const isUpcoming = match.state === MatchStateEnum.Upcoming
    const [homeScore, setHomeScore] = useState<string>(match.prediction?.homeScore?.toString() ?? "")
    const [awayScore, setAwayScore] = useState<string>(match.prediction?.awayScore?.toString() ?? "")
    const [isSending, setIsSending] = useState(false)
    const [savedPrediction, setSavedPrediction] = useState<{home: number; away: number} | undefined>(
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
        if (isNaN(h) || isNaN(a)) {
            toast.error("Scores must be numbers")
            return
        }
        setIsSending(true)
        try {
            await handlePrediction(h, a, match.matchId)
            setSavedPrediction({home: h, away: a})
            toast.success("Prediction saved")
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
        <div className="relative rounded-3xl bg-gradient-to-br from-white/15 to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
            <div className="relative rounded-3xl bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-[62%] aspect-square md:aspect-auto md:min-h-[480px] bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
                        <div className="absolute inset-0">
                            <FocusedGlobeClient homeCode={homeCode} awayCode={awayCode}/>
                        </div>
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                            <span className="inline-flex items-center gap-2 rounded-full bg-black/50 border border-white/10 px-3 py-1 text-xs font-semibold text-gray-200 backdrop-blur">
                                {match.state === MatchStateEnum.Live && (
                                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>
                                )}
                                {match.state === MatchStateEnum.Live ? "Live" : ROUND_LABEL[match.round]}
                            </span>
                            <span className="hidden sm:inline rounded-full bg-black/50 border border-white/10 px-3 py-1 text-xs text-gray-300 backdrop-blur">
                                {match.venue}
                            </span>
                        </div>
                    </div>

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
                </div>
            </div>
        </div>
    )
}

function TeamSide({code, name, reverse}: {code: string; name: string; reverse?: boolean}) {
    return (
        <div className={`flex flex-col items-center gap-2 w-20 ${reverse ? "order-last" : ""}`}>
            <div className="h-12 w-12 rounded-full ring-2 ring-white/20 shadow-lg overflow-hidden bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={`https://flagcdn.com/w160/${code}.png`}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            </div>
            <span className="text-xs font-semibold tracking-wide text-gray-200 text-center truncate w-full">
                {name}
            </span>
        </div>
    )
}

function ScoreInput({value, onChange, disabled}: {value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean}) {
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

function MatchStrip({
    liveMatches,
    upcomingMatches,
    selectedId,
    onSelect,
}: {
    liveMatches: Match[]
    upcomingMatches: Match[]
    selectedId: string
    onSelect: (id: string) => void
}) {
    return (
        <div className="space-y-4">
            {liveMatches.length > 0 && (
                <StripRow title="Live" matches={liveMatches} selectedId={selectedId} onSelect={onSelect} live/>
            )}
            {upcomingMatches.length > 0 && (
                <StripRow title="Upcoming" matches={upcomingMatches} selectedId={selectedId} onSelect={onSelect}/>
            )}
        </div>
    )
}

function StripRow({
    title,
    matches,
    selectedId,
    onSelect,
    live,
}: {
    title: string
    matches: Match[]
    selectedId: string
    onSelect: (id: string) => void
    live?: boolean
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    return (
        <div>
            <div className="flex items-center gap-2 mb-2 px-1">
                {live && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>}
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">{title}</h3>
            </div>
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin"
                style={{scrollbarWidth: "thin"}}
            >
                {matches.map(m => (
                    <MatchPill
                        key={m.matchId}
                        match={m}
                        selected={m.matchId === selectedId}
                        onSelect={() => onSelect(m.matchId)}
                    />
                ))}
            </div>
        </div>
    )
}

function MatchPill({match, selected, onSelect}: {match: Match; selected: boolean; onSelect: () => void}) {
    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()
    const predicted = match.prediction

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`snap-start shrink-0 rounded-2xl p-[1.5px] transition-transform ${
                selected
                    ? "bg-gradient-to-br from-blue-500 via-cyan-400 to-green-300 scale-[1.02]"
                    : "bg-white/10 hover:bg-white/20"
            }`}
        >
            <div className="rounded-2xl bg-gray-900/90 px-4 py-3 min-w-[200px] text-left">
                <div className="flex items-center justify-between gap-3">
                    <PillFlag code={homeCode} name={match.homeTeam}/>
                    <span className="text-xs font-semibold text-gray-500">vs</span>
                    <PillFlag code={awayCode} name={match.awayTeam}/>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                    <div className="text-gray-500">
                        <LocalTime date={match.datetime}/>
                    </div>
                    {predicted ? (
                        <span className="font-bold text-cyan-300">
                            {predicted.homeScore} - {predicted.awayScore}
                        </span>
                    ) : (
                        <span className="text-gray-500">No prediction</span>
                    )}
                </div>
            </div>
        </button>
    )
}

function PillFlag({code, name}: {code: string; name: string}) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full ring-1 ring-white/20 overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/w80/${code}.png`} alt={name} className="h-full w-full object-cover"/>
            </div>
            <span className="text-xs font-bold text-gray-200 truncate">{name}</span>
        </div>
    )
}
