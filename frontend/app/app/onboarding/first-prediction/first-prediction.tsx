'use client'

import React, {useState} from "react"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {Toaster} from "react-hot-toast"
import {Match, MatchRoundEnum} from "@/client"
import PredictionForm from "@/app/components/predictions/prediction-form"
import FocusedGlobeClient from "@/app/components/flags/focused-globe-client"
import {LocalTime} from "@/app/components/predictions/local-time"
import type {UserChips} from "@/app/components/predictions/get-user-chips"
import PageShell from "@/app/components/page-shell"
import SurfaceCard from "@/app/components/surface-card"
import {EYEBROW_CYAN, GLASS_PILL, GLASS_PILL_BOLD} from "@/app/util/css-classes"

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_THIRTY_TWO: "Round of 32",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
    THIRD_PLACE_PLAYOFF: "Third-Place Playoff",
    FINAL: "Final",
}

interface FirstPredictionProps {
    match: Match
    userChips: UserChips
    destination: string
}

export default function FirstPrediction({match, userChips, destination}: FirstPredictionProps): React.JSX.Element {
    const router = useRouter()
    const [chips, setChips] = useState<UserChips>(userChips)
    const homeCode = match.homeTeamFlagCode.toLowerCase()
    const awayCode = match.awayTeamFlagCode.toLowerCase()

    return (
        <PageShell>
            <div className="relative w-full max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
                <Toaster/>

                <div className="flex flex-col items-center text-center mb-8">
                    <span className={EYEBROW_CYAN}>Last step</span>
                    <h1 className="mt-3 text-3xl font-black tracking-tight">Make your first prediction</h1>
                    <p className="mt-3 text-slate-500 dark:text-gray-400">
                        Call the score, optionally add a power-up, and you&apos;re in. You can change your prediction any time before kickoff.
                    </p>
                </div>

                <SurfaceCard solid innerClassName="relative backdrop-blur-xl overflow-hidden">
                    <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
                        <div className="absolute inset-0">
                            <FocusedGlobeClient homeCode={homeCode} awayCode={awayCode} venue={match.venue}/>
                        </div>
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                            <span className={GLASS_PILL_BOLD}>
                                {ROUND_LABEL[match.round]}
                            </span>
                            <span className={GLASS_PILL}>
                                <LocalTime date={match.datetime}/>
                            </span>
                        </div>
                    </div>
                    <PredictionForm
                        match={match}
                        userChips={chips}
                        onChipsChanged={setChips}
                        onPredictionSaved={() => router.replace(destination)}
                        coachPowerUps
                        confirmIfUntouched
                    />
                </SurfaceCard>

                <div className="mt-6 text-center">
                    <Link href={destination} replace className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        Skip for now
                    </Link>
                </div>
            </div>
        </PageShell>
    )
}
