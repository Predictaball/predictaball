import React from "react"
import Link from "next/link"

interface WordmarkProps {
    /** Extra classes for positioning (e.g. absolute-centering on sub-pages). */
    className?: string
}

/**
 * The predicta·ball·.LIVE wordmark. Single source of truth so the colour,
 * weights and the .LIVE suffix stay identical everywhere it appears (app header,
 * every sub-page header, etc.). A solid brand-indigo "predicta" reads as a
 * deliberate logotype rather than the ubiquitous gradient-text treatment.
 */
export default function Wordmark({className = ""}: WordmarkProps): React.JSX.Element {
    return (
        <Link href="/" className={`flex items-baseline font-black tracking-tight text-lg ${className}`}>
            <span className="text-indigo-600 dark:text-indigo-400">predicta</span>
            <span className="text-slate-900 dark:text-white">ball</span>
            <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
        </Link>
    )
}
