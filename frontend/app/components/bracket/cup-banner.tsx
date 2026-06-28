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
            className="group relative block rounded-3xl bg-gradient-to-br from-amber-400/40 via-orange-400/20 to-amber-500/10 p-[1px] shadow-xl shadow-orange-500/10 transition-shadow duration-300 hover:shadow-2xl hover:shadow-orange-500/20"
        >
            <div className="flex items-center gap-4 rounded-3xl bg-white/70 p-4 backdrop-blur-sm dark:bg-white/[0.03] sm:p-5">
                <div aria-hidden className="text-3xl sm:text-4xl">🏆</div>
                <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-black tracking-tight">Knockout Cup</div>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                        Back teams to go through and lift your league&apos;s cup.
                    </p>
                </div>
                <span aria-hidden className="text-lg font-bold text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-amber-400">
                    →
                </span>
            </div>
        </Link>
    )
}
