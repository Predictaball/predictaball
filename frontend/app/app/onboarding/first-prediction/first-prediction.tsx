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

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
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
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative w-full max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
                <Toaster/>

                <div className="flex flex-col items-center text-center mb-8">
                    <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase">Last step</span>
                    <h1 className="mt-3 text-3xl font-black tracking-tight">Make your first prediction</h1>
                    <p className="mt-3 text-slate-500 dark:text-gray-400">
                        Call the score, optionally add a power-up, and you&apos;re in. You can change your prediction any time before kickoff.
                    </p>
                </div>

                <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
                    <div className="relative rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                        <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
                            <div className="absolute inset-0">
                                <FocusedGlobeClient homeCode={homeCode} awayCode={awayCode} venue={match.venue}/>
                            </div>
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 text-slate-700 dark:bg-black/50 dark:border-white/10 dark:text-gray-200 px-3 py-1 text-xs font-semibold backdrop-blur">
                                    {ROUND_LABEL[match.round]}
                                </span>
                                <span className="rounded-full bg-white/80 border border-slate-200 text-slate-600 dark:bg-black/50 dark:border-white/10 dark:text-gray-300 px-3 py-1 text-xs backdrop-blur">
                                    <LocalTime date={match.datetime}/>
                                </span>
                            </div>
                        </div>
                        <PredictionForm
                            match={match}
                            userChips={chips}
                            onChipsChanged={setChips}
                            onPredictionSaved={() => router.push(destination)}
                            coachPowerUps
                            confirmIfUntouched
                        />
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href={destination} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        Skip for now
                    </Link>
                </div>
            </div>
        </main>
    )
}
