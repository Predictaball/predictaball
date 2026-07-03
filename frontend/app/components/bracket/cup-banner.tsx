import React from "react"
import Link from "next/link"

/**
 * Dashboard entry point into the Knockout Cup side-game. Warm amber framing so
 * it reads as something extra to do, distinct from the cool brand surfaces.
 */
export default function CupBanner(): React.JSX.Element {
    return (
        <Link
            href="/app/bracket"
            className="group relative block rounded-xl border-[1.5px] border-amber-400 dark:border-amber-300/60 bg-white dark:bg-gray-900 transition-colors hover:border-amber-500 dark:hover:border-amber-300"
        >
            <div className="flex items-center gap-4 rounded-xl p-4 sm:p-5">
                <div aria-hidden className="text-3xl sm:text-4xl">🏆</div>
                <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-black tracking-tight">Knockout Cup</div>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                        Back teams to go through, build a streak, and lift your league&apos;s cup.
                    </p>
                </div>
                <span aria-hidden className="text-lg font-bold text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-amber-400">
                    →
                </span>
            </div>
        </Link>
    )
}
