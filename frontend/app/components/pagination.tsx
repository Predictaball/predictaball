'use client'

import React from "react"
import {BUTTON_CLASS} from "@/app/util/css-classes"

interface PaginationProps {
    /** Current page, 1-indexed. */
    page: number
    /** Total number of pages. */
    total: number
    /** Called with the next 1-indexed page when the user navigates. */
    onChange: (page: number) => void
    /** Extra classes for the outer pill (e.g. positioning). */
    className?: string
}

function ChevronLeft(): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="m15 18-6-6 6-6"/>
        </svg>
    )
}

function ChevronRight(): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="m9 18 6-6-6-6"/>
        </svg>
    )
}

/**
 * Compact "Page X of Y" pagination — a floating glass pill with Prev / Next
 * controls and a live page counter. Scales to any list length and stays
 * cohesive with the brand palette. Presentational only: callers own the
 * paging state and any scroll behaviour.
 */
export default function Pagination(props: PaginationProps): React.JSX.Element {
    const canPrev = props.page > 1
    const canNext = props.page < props.total

    const segment = "flex items-center gap-1.5 h-9 rounded-full text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    const ghost = "text-slate-600 dark:text-gray-300 enabled:hover:bg-slate-900/10 dark:enabled:hover:bg-white/10"

    return (
        <nav
            aria-label="Pagination"
            className={`inline-flex items-stretch gap-1 p-1.5 rounded-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-slate-200/70 dark:border-white/10 shadow-lg shadow-slate-900/5 ${props.className ?? ""}`}
        >
            <button
                type="button"
                aria-label="Previous page"
                disabled={!canPrev}
                onClick={() => canPrev && props.onChange(props.page - 1)}
                className={`${segment} ${ghost} pl-3 pr-4`}
            >
                <ChevronLeft/>
                <span>Prev</span>
            </button>

            <div
                aria-live="polite"
                className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-slate-900/5 dark:bg-white/5 text-sm font-bold tabular-nums select-none"
            >
                <span className="text-pitch-700 dark:text-pitch-300">
                    {props.page}
                </span>
                <span className="text-slate-300 dark:text-gray-600">/</span>
                <span className="text-slate-500 dark:text-gray-400">{props.total}</span>
            </div>

            <button
                type="button"
                aria-label="Next page"
                disabled={!canNext}
                onClick={() => canNext && props.onChange(props.page + 1)}
                className={`${segment} ${BUTTON_CLASS} enabled:hover:scale-[1.02] disabled:shadow-none pl-4 pr-3`}
            >
                <span>Next</span>
                <ChevronRight/>
            </button>
        </nav>
    )
}
