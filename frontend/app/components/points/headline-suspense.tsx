import React, { Suspense } from "react";
import Headline from "@/app/components/points/headline";
import DefaultCards from "@/app/components/points/default-cards";
import TournamentCountdown from "@/app/components/points/tournament-countdown";

interface HeadlineSuspenseProps {
    tournamentStarted: boolean
    nextKickoff?: Date
    hasLiveMatch: boolean
}

function calendarDaysUntil(kickoff: Date): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(kickoff)
    target.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export default function HeadlineSuspense({tournamentStarted, nextKickoff, hasLiveMatch}: HeadlineSuspenseProps): React.JSX.Element | null {
    if (!tournamentStarted && nextKickoff && nextKickoff.getTime() > Date.now()) {
        return <TournamentCountdown kickoff={nextKickoff} initialDays={calendarDaysUntil(nextKickoff)} />
    }

    return (
        <Suspense fallback={<DefaultCards />}>
            <Headline hasLiveMatch={hasLiveMatch} />
        </Suspense>
    )
}
