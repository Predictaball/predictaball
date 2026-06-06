'use client'

import React, {useMemo} from "react"
import {Button} from "@nextui-org/react"
import {Match} from "@/client"
import {useCountdown} from "@/app/components/predictions/match-countdown"
import {useMatchSelection} from "@/app/components/predictions/match-selection"
import {ACTION_TINT, BUTTON_CLASS} from "@/app/util/css-classes"
import {SHORT_COUNTRY_NAMES} from "@/app/util/teams"

function shortName(name: string): string {
    return SHORT_COUNTRY_NAMES[name.toLowerCase()] ?? name
}

export default function PredictNowBanner({upcomingMatches}: {upcomingMatches: Match[]}): React.JSX.Element | null {
    const {setSelectedId} = useMatchSelection()
    const unpredicted = useMemo(
        () => upcomingMatches.filter(m => !m.prediction).sort((a, b) => a.datetime.valueOf() - b.datetime.valueOf()),
        [upcomingMatches],
    )
    const next = unpredicted[0]
    const countdown = useCountdown(next?.datetime ?? new Date())

    if (!next) return null

    const onPredict = () => {
        setSelectedId(next.matchId)
        document.getElementById("matches")?.scrollIntoView({behavior: "smooth", block: "start"})
    }

    return (
        <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${ACTION_TINT}`}>
            <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"/>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"/>
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {unpredicted.length} {unpredicted.length === 1 ? "match needs" : "matches need"} your prediction
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                        Next: {shortName(next.homeTeam)} v {shortName(next.awayTeam)}{countdown ? ` · ${countdown}` : ""}
                    </p>
                </div>
            </div>
            <Button onPress={onPredict} size="sm" radius="full" className={BUTTON_CLASS + " shrink-0"}>
                Predict now
            </Button>
        </div>
    )
}
