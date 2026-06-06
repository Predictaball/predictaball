'use client'

import React, { useEffect, useState } from "react"

interface TournamentCountdownProps {
    kickoff: Date
    initialDays: number
}

interface DaysMode { mode: "days"; days: number }
interface HoursMinsMode { mode: "hoursMins"; hours: number; minutes: number }
interface ImminentMode { mode: "imminent" }
type Display = DaysMode | HoursMinsMode | ImminentMode

function calendarDaysUntil(kickoff: Date): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(kickoff)
    target.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function compute(kickoff: Date): Display {
    const days = calendarDaysUntil(kickoff)
    if (days > 0) return { mode: "days", days }
    const ms = kickoff.getTime() - Date.now()
    if (ms <= 0) return { mode: "imminent" }
    const totalMinutes = Math.max(1, Math.floor(ms / 60_000))
    return { mode: "hoursMins", hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

export default function TournamentCountdown({ kickoff, initialDays }: TournamentCountdownProps): React.JSX.Element {
    const [display, setDisplay] = useState<Display>({ mode: "days", days: initialDays })

    useEffect(() => {
        setDisplay(compute(kickoff))
        const id = setInterval(() => setDisplay(compute(kickoff)), 30_000)
        return () => clearInterval(id)
    }, [kickoff])

    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
            <div className="rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-sm px-6 py-7 sm:py-10 text-center">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400 mb-3">
                    Kickoff in
                </div>
                {display.mode === "days" && (
                    <>
                        <BigNumber value={display.days}/>
                        <Caption text={display.days === 1 ? "day" : "days"}/>
                    </>
                )}
                {display.mode === "hoursMins" && <HoursMins hours={display.hours} minutes={display.minutes}/>}
                {display.mode === "imminent" && <Imminent/>}
                <div className="mt-5 text-sm text-slate-600 dark:text-gray-300">
                    Get your predictions in before the first whistle.
                </div>
            </div>
        </div>
    )
}

function BigNumber({ value }: { value: number }) {
    return (
        <div className="text-5xl sm:text-7xl font-black leading-none tracking-tight">
            <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 bg-clip-text text-transparent tabular-nums">
                {value}
            </span>
        </div>
    )
}

function Caption({ text }: { text: string }) {
    return (
        <div className="mt-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400">
            {text}
        </div>
    )
}

function HoursMins({ hours, minutes }: { hours: number; minutes: number }) {
    return (
        <div className="flex items-start justify-center gap-3 sm:gap-4">
            {hours > 0 && (
                <>
                    <Unit value={hours.toString().padStart(2, "0")} label={hours === 1 ? "hour" : "hours"}/>
                    <Sep/>
                </>
            )}
            <Unit value={minutes.toString().padStart(2, "0")} label={minutes === 1 ? "min" : "mins"}/>
        </div>
    )
}

function Sep() {
    return (
        <span className="text-4xl sm:text-6xl font-black leading-none bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
            :
        </span>
    )
}

function Unit({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col items-center min-w-[3.5rem]">
            <span className="text-4xl sm:text-6xl font-black tabular-nums leading-none bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                {value}
            </span>
            <span className="mt-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                {label}
            </span>
        </div>
    )
}

function Imminent() {
    return (
        <div className="text-3xl sm:text-5xl font-black leading-none tracking-tight">
            <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                Kicking off now
            </span>
        </div>
    )
}
