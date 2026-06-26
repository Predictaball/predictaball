import React from "react"
import Link from "next/link"

interface WordmarkProps {
    /** Extra classes for positioning (e.g. absolute-centering on sub-pages). */
    className?: string
}

/**
 * The predicta·ball·.LIVE wordmark. Single source of truth so the gradient,
 * weights and the .LIVE suffix stay identical everywhere it appears (app header,
 * every sub-page header, etc.).
 */
export default function Wordmark({className = ""}: WordmarkProps): React.JSX.Element {
    return (
        <Link href="/" className={`flex items-baseline font-black tracking-tight text-lg ${className}`}>
            <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">predicta</span>
            <span className="text-slate-900 dark:text-white">ball</span>
            <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
        </Link>
    )
}
