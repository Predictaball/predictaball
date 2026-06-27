'use client'

import React, {Suspense, useEffect} from "react"
import Link from "next/link"
import {useSearchParams} from "next/navigation"
import {ACTION_BUTTON_CLASS} from "@/app/util/css-classes"
import {markKnockoutExplainerSeen} from "@/app/components/predictions/knockout-explainer"

export default function KnockoutExplainerPage(): React.JSX.Element {
    return (
        <Suspense>
            <KnockoutExplainerContent/>
        </Suspense>
    )
}

function KnockoutExplainerContent(): React.JSX.Element {
    const searchParams = useSearchParams()
    const next = searchParams.get("next")
    const continueHref = next ?? "/app"

    // Mark as seen the moment the page is shown, so the redirect only ever fires
    // once — even if the user navigates away without pressing the button below.
    useEffect(() => {
        markKnockoutExplainerSeen()
    }, [])

    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative px-6 lg:px-10 py-16 sm:py-24 flex flex-col items-center">
                <div className="flex flex-col items-center text-center mb-12">
                    <span className="flex items-baseline font-black tracking-tight text-lg mb-6">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">predicta</span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </span>
                    <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase">Knockouts are here</span>
                    <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
                        <span className="text-slate-900 dark:text-white">There&apos;s no </span>
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">draws</span>
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
                        title="Call the 90 minutes"
                        body="Predict the full-time score exactly like you always have — the same 5 points for the exact score, 2 for the right result."
                    />
                    <ExplainerCard
                        accent="from-cyan-500/30 to-teal-400/20 ring-cyan-400/30"
                        glyph={<span className="font-black text-cyan-600 dark:text-cyan-300" aria-hidden>&rsaquo;</span>}
                        title="Pick who goes through"
                        body="If you call a draw, the match can't end level — so tap the team you think edges it in extra time or on penalties."
                    />
                    <ExplainerCard
                        accent="from-green-500/30 to-emerald-400/20 ring-green-400/30"
                        glyph={<span className="font-black text-cyan-600 dark:text-cyan-300" aria-hidden>2&times;</span>}
                        title="Power-ups still count"
                        body="Your remaining Double Points, Off by One and Follow the Crowd chips all work in the knockouts. Now's the time to spend them."
                    />
                </div>

                <div className="mt-20 flex justify-center">
                    <Link
                        href={continueHref}
                        replace
                        onClick={markKnockoutExplainerSeen}
                        className={`inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg ${ACTION_BUTTON_CLASS}`}
                    >
                        Got it — let&apos;s predict
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
    body: string
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
