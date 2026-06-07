import React from "react"
import Link from "next/link"
import HowItWorks from "@/app/components/landing/how-it-works"
import {ACTION_BUTTON_CLASS} from "@/app/util/css-classes"

export default async function OnboardingHowItWorksPage({searchParams}: {searchParams: Promise<{next?: string}>}): Promise<React.JSX.Element> {
    const {next} = await searchParams
    const firstPredictionHref = next
        ? `/app/onboarding/first-prediction?next=${encodeURIComponent(next)}`
        : "/app/onboarding/first-prediction"

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
                    <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase">You&apos;re in!</span>
                    <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Here&apos;s how it all works</h1>
                    <p className="mt-3 max-w-xl text-slate-500 dark:text-gray-400">
                        Take a quick read, then make your very first prediction.
                    </p>

                    <div className="mt-8 flex flex-col items-center gap-1.5 text-slate-400 dark:text-gray-500">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">Scroll to begin</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 animate-bounce" aria-hidden>
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </div>
                </div>

                <HowItWorks compact>
                    <div className="mt-20 flex justify-center">
                        <Link
                            href={firstPredictionHref}
                            replace
                            className={`inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg ${ACTION_BUTTON_CLASS}`}
                        >
                            Make your first prediction
                            <span aria-hidden>&rarr;</span>
                        </Link>
                    </div>
                </HowItWorks>
            </div>
        </main>
    )
}
