import React from "react"

interface EmptyStateProps {
    children: React.ReactNode
    /** Extra classes for the outer wrapper (e.g. width/margin overrides). */
    className?: string
    /** Overrides the default padding and text sizing/colour entirely. */
    contentClassName?: string
}

/**
 * The flat "nothing to show yet" placeholder — SurfaceCard's sibling for
 * empty states. Centralised here so every zero-state message shares the same
 * card treatment, and so it can be tuned in one place instead of several.
 */
export default function EmptyState({children, className = "", contentClassName = ""}: EmptyStateProps): React.JSX.Element {
    return (
        <div className={`rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 text-center ${contentClassName || "px-4 py-6 text-sm text-slate-500 dark:text-gray-400"} ${className}`}>
            {children}
        </div>
    )
}
