'use client'

import React, {useEffect, useState} from "react"
import {Match, MatchStateEnum} from "@/client"
import {LocalTime} from "@/app/components/ticket/local-time"

const COUNTDOWN_TICK_MS = 60_000

function formatCountdown(datetime: Date): string {
    const ms = datetime.getTime() - Date.now()
    if (ms <= 0) return "Kicking off now"

    const totalMinutes = Math.floor(ms / 60_000)
    if (totalMinutes === 0) return "Kicking off now"

    const days = Math.floor(totalMinutes / (60 * 24))
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
    const minutes = totalMinutes % 60

    if (days >= 1) {
        return `${datetime.toLocaleDateString(undefined, {month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"})}`
    }
    if (hours >= 1) return `Kick off: ${hours}h ${minutes}m`
    return `Kick off: ${minutes} min`
}

function useCountdown(datetime: Date): string | undefined {
    const [label, setLabel] = useState<string | undefined>(undefined)
    useEffect(() => {
        setLabel(formatCountdown(datetime))
        const id = setInterval(() => setLabel(formatCountdown(datetime)), COUNTDOWN_TICK_MS)
        return () => clearInterval(id)
    }, [datetime])
    return label
}

export function MatchCountdown({match}: {match: Match}): React.JSX.Element {
    const countdown = useCountdown(match.datetime)

    if (match.state !== MatchStateEnum.Upcoming) {
        return <LocalTime date={match.datetime}/>
    }

    return <span>{countdown ?? " "}</span>
}
