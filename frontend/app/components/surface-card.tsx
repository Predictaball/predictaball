import React from "react"

interface SurfaceCardProps {
    children: React.ReactNode
    /** Extra classes for the outer gradient-border frame. */
    className?: string
    /** Extra classes for the inner panel (e.g. padding overrides). */
    innerClassName?: string
    /**
     * Opaque "hero panel" treatment (bigger shadow, no hover-lift, solid
     * background) instead of the default translucent list-card. Use for a
     * single focal panel — prediction tickets, the points headline, a
     * standalone table — rather than an item within a list of peers.
     */
    solid?: boolean
}

/**
 * The app's signature surface: a hairline gradient "border" (a 1px-padded
 * gradient frame) wrapping a frosted panel. Centralised here so every elevated
 * card — leagues, leaderboards, group tables — shares the exact same depth,
 * radius and glow, and so the treatment can be tuned in one place.
 *
 * A gentle shadow lift on hover gives the cards a touch of life without
 * implying the whole surface is a single tap target.
 */
export default function SurfaceCard({children, className = "", innerClassName = "", solid = false}: SurfaceCardProps): React.JSX.Element {
    const outer = solid
        ? "relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10"
        : "relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 p-[1px] shadow-xl shadow-slate-900/5 transition-shadow duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 dark:from-white/15 dark:to-white/5 dark:shadow-cyan-500/5 dark:hover:shadow-cyan-500/15"
    const inner = solid ? "rounded-3xl bg-white dark:bg-gray-900/80" : "rounded-3xl bg-white/60 backdrop-blur-sm dark:bg-white/[0.03]"
    return (
        <div className={`${outer} ${className}`}>
            <div className={`${inner} ${innerClassName || "p-5 sm:p-6"}`}>
                {children}
            </div>
        </div>
    )
}
