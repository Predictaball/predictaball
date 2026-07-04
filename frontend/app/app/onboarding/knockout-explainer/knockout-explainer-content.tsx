'use client'

import FeatureCard from "@/app/components/feature-card"
import FocusedGlobeClient from "@/app/components/flags/focused-globe-client"
import type { UserChips } from "@/app/components/predictions/get-user-chips"
import { markKnockoutExplainerSeen } from "@/app/components/predictions/knockout-explainer"
import { LocalTime } from "@/app/components/predictions/local-time"
import PredictionForm from "@/app/components/predictions/prediction-form"
import PageShell from "@/app/components/page-shell"
import SurfaceCard from "@/app/components/surface-card"
import { ACTION_BUTTON_CLASS, BRAND_TEXT_GRADIENT_LIGHT, EYEBROW_CYAN, GLASS_PILL, GLASS_PILL_BOLD, MODAL_TITLE, TEXT_PRIMARY } from "@/app/util/css-classes"
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
        <PageShell>
            <div className="relative px-6 lg:px-10 py-16 sm:py-24 flex flex-col items-center">
                <Toaster/>

                <div className="flex flex-col items-center text-center mb-12">
                    <span className="flex items-baseline font-black tracking-tight text-lg mb-6">
                        <span className={BRAND_TEXT_GRADIENT_LIGHT}>predicta</span>
                        <span className={TEXT_PRIMARY}>ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </span>
                    <span className={EYEBROW_CYAN}>Knockouts are here</span>
                    <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
                        <span className={TEXT_PRIMARY}>There has to be a </span>
                        <span className={BRAND_TEXT_GRADIENT_LIGHT}>winner</span>
                        <span className={TEXT_PRIMARY}> from here</span>
                    </h1>
                    <p className="mt-3 max-w-xl text-slate-500 dark:text-gray-400">
                        It&apos;s win or go home. Predicting a knockout match works just like the group stage, with one extra call to make.
                    </p>
                </div>

                <div className="relative max-w-5xl w-full mx-auto grid md:grid-cols-3 gap-6">
                    <FeatureCard accent="from-blue-600/30 to-cyan-400/20 ring-cyan-400/30 text-2xl" icon={<span aria-hidden>&#9917;</span>} title="Call the final score">
                        <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Predict the score <strong className="font-bold text-cyan-600 dark:text-cyan-300">after extra time</strong>, if it&apos;s played — penalties don&apos;t change it. Same scoring as the group stage: 5 points for the exact score, 2 for the right result.</p>
                    </FeatureCard>
                    <FeatureCard accent="from-cyan-500/30 to-teal-400/20 ring-cyan-400/30 text-2xl" icon={<span className="font-black text-cyan-600 dark:text-cyan-300" aria-hidden>&rsaquo;</span>} title="Pick who goes through">
                        <p className="text-slate-600 dark:text-gray-400 leading-relaxed">If you call a draw, tap the team you back to advance. This pick powers a brand-new bracket game we&apos;re building — more info coming soon!</p>
                    </FeatureCard>
                    <FeatureCard accent="from-green-500/30 to-emerald-400/20 ring-green-400/30 text-2xl" icon={<span className="font-black text-cyan-600 dark:text-cyan-300" aria-hidden>2&times;</span>} title="Power-ups still count">
                        <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Your remaining Double Points, Off by One and Follow the Crowd chips all work in the knockouts — and you get <strong className="font-bold text-cyan-600 dark:text-cyan-300">1 more of each</strong>.</p>
                    </FeatureCard>
                </div>

                {match && (
                    <div className="mt-16 w-full max-w-lg mx-auto">
                        <div className="flex flex-col items-center text-center mb-6">
                            <span className={EYEBROW_CYAN}>Try it now</span>
                            <h2 className={`mt-2 ${MODAL_TITLE}`}>Make a knockout prediction</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                                Call the score after extra time, if played, below. Land on a draw and you&apos;ll back a team to go through — part of a new bracket game, more soon.
                            </p>
                        </div>

                        <SurfaceCard solid innerClassName="relative backdrop-blur-xl overflow-hidden">
                            <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
                                <div className="absolute inset-0">
                                    <FocusedGlobeClient homeCode={match.homeTeamFlagCode.toLowerCase()} awayCode={match.awayTeamFlagCode.toLowerCase()} venue={match.venue}/>
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
                                onPredictionSaved={() => router.replace(continueHref)}
                                coachKnockoutSide
                            />
                        </SurfaceCard>
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
        </PageShell>
    )
}
