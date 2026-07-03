import React from "react"

interface SurfaceCardProps {
    children: React.ReactNode
    /** Extra classes for the outer bordered frame. */
    className?: string
    /** Extra classes for the inner panel (e.g. padding overrides). */
    innerClassName?: string
}

/**
 * The app's signature surface: a solid, opaque panel with a hard hairline
 * border — matchday programme, not frosted glass. Centralised here so every
 * elevated card — leagues, leaderboards, group tables — shares the exact same
 * depth and radius, and so the treatment can be tuned in one place.
 */
export default function SurfaceCard({children, className = "", innerClassName = ""}: SurfaceCardProps): React.JSX.Element {
    return (
        <div className={`relative rounded-xl border-[1.5px] border-slate-300 bg-white dark:border-white/15 dark:bg-gray-900 ${className}`}>
            <div className={`rounded-xl ${innerClassName || "p-5 sm:p-6"}`}>
                {children}
            </div>
        </div>
    )
}
