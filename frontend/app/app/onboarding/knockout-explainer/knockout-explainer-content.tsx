'use client'

import FocusedGlobeClient from "@/app/components/flags/focused-globe-client"
import type { UserChips } from "@/app/components/predictions/get-user-chips"
import { markKnockoutExplainerSeen } from "@/app/components/predictions/knockout-explainer"
import { LocalTime } from "@/app/components/predictions/local-time"
import PredictionForm from "@/app/components/predictions/prediction-form"
import { ACTION_BUTTON_CLASS } from "@/app/util/css-classes"
import { Match, MatchRoundEnum } from "@/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { Toaster } from "react-hot-toast"

const ROUND_LABEL: Record<MatchRoundEnum, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_THIRTY_TWO: "Round of 32",
    ROUND_OF_SIXTEEN: "Round of 16",
    QUARTER_FINAL: "Quarter-Final",
    SEMI_FINAL: "Semi-Final",
    THIRD_PLACE_PLAYOFF: "Third-Place Playoff",
    FINAL: "Final",
}

interface KnockoutExplainerContentProps {
    continueHref: string
    match?: Match
    userChips: UserChips
}

export default function KnockoutExplainerContent({continueHref, match, userChips}: KnockoutExplainerContentProps): React.JSX.Element {
    const router = useRouter()
    const [chips, setChips] = useState<UserChips>(userChips)

    // Mark as seen the moment the page is shown, so the redirect only ever fires
    // once — even if the user navigates away without pressing the button below.
    useEffect(() => {
        markKnockoutExplainerSeen()
    }, [])

    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative px-6 lg:px-10 py-16 sm:py-24 flex flex-col items-center">
                <Toaster/>

                <div className="flex flex-col items-center text-center mb-12">
                    <span className="flex items-baseline font-black tracking-tight text-lg mb-6">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">predicta</span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </span>
                    <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase">Knockouts are here</span>
                    <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
                        <span className="text-slate-900 dark:text-white">There has to be a</span>
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">winner</span>
                        <span className="text-slate-900 dark:text-white"> from here</span>
                    </h1>
                    <p className="mt-3 max-w-xl text-slate-500 dark:text-gray-400">
                        It&apos;s win or go home. Predicting a knockout match works just like the group stage, with one extra call to make.
                    </p>
                </div>

                <div className="relative max-w-5xl w-full mx-auto grid md:grid-cols-3 gap-6">
                    <ExplainerCard
                        accent="from-blue-600/30 to-cyan-400/20 ring-cyan-400/30"
                        glyph={<span aria-hidden>&#9917;</span>}
                        title="Call the final score"
                        body={<>Predict the score <strong className="font-bold text-cyan-600 dark:text-cyan-300">after extra time</strong>, if it&apos;s played — penalties don&apos;t change it. Same scoring as the group stage: 5 points for the exact score, 2 for the right result.</>}
                    />
                    <ExplainerCard
                        accent="from-cyan-500/30 to-teal-400/20 ring-cyan-400/30"
                        glyph={<span className="font-black text-cyan-600 dark:text-cyan-300" aria-hidden>&rsaquo;</span>}
                        title="Pick who goes through"
                        body="If you call a draw, tap the team you back to advance. This pick powers a brand-new bracket game we're building — more info coming soon!"
                    />
                    <ExplainerCard
                        accent="from-green-500/30 to-emerald-400/20 ring-green-400/30"
                        glyph={<span className="font-black text-cyan-600 dark:text-cyan-300" aria-hidden>2&times;</span>}
                        title="Power-ups still count"
                        body={<>Your remaining Double Points, Off by One and Follow the Crowd chips all work in the knockouts — and you get <strong className="font-bold text-cyan-600 dark:text-cyan-300">1 more of each</strong>.</>}
                    />
                </div>

                {match && (
                    <div className="mt-16 w-full max-w-lg mx-auto">
                        <div className="flex flex-col items-center text-center mb-6">
                            <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase">Try it now</span>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Make a knockout prediction</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                                Call the score after extra time, if played, below. Land on a draw and you&apos;ll back a team to go through — part of a new bracket game, more soon.
                            </p>
                        </div>

                        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
                            <div className="relative rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                                <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
                                    <div className="absolute inset-0">
                                        <FocusedGlobeClient homeCode={match.homeTeamFlagCode.toLowerCase()} awayCode={match.awayTeamFlagCode.toLowerCase()} venue={match.venue}/>
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
                                    onPredictionSaved={() => router.replace(continueHref)}
                                    coachKnockoutSide
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-20 flex justify-center">
                    <Link
                        href={continueHref}
                        replace
                        onClick={markKnockoutExplainerSeen}
                        className={`inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg ${ACTION_BUTTON_CLASS}`}
                    >
                        {match ? "Got it — take me back" : "Got it — let's predict"}
                        <span aria-hidden>&rarr;</span>
                    </Link>
                </div>
            </div>
        </main>
    )
}

function ExplainerCard({accent, glyph, title, body}: {
    accent: string
    glyph: React.ReactNode
    title: string
    body: React.ReactNode
}): React.JSX.Element {
    return (
        <div className="group relative rounded-2xl bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-white/10 dark:to-white/5 p-[1px] transition-transform hover:-translate-y-1">
            <div className="relative h-full rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ring-1 text-2xl mb-5 ${accent}`}>
                    {glyph}
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-tight">{title}</h3>
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">{body}</p>
            </div>
        </div>
    )
}
