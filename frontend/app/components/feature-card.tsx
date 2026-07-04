import React from "react"
import { FEATURE_CARD_TITLE } from "@/app/util/css-classes"

interface FeatureCardProps {
    /** Icon tile's gradient, ring colour, and any glyph sizing/colour classes, e.g. "from-blue-600/30 to-cyan-400/20 ring-cyan-400/30 text-2xl". */
    accent: string
    icon: React.ReactNode
    title: string
    children: React.ReactNode
}

/**
 * A hover-lift feature card: icon tile, title, body copy. Shared by the
 * landing page's "How it works" / "Power-ups" grids and the knockout
 * explainer, which both present the same three-up feature grid with
 * different copy.
 */
export default function FeatureCard({accent, icon, title, children}: FeatureCardProps): React.JSX.Element {
    return (
        <div className="group relative rounded-2xl bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-white/10 dark:to-white/5 p-[1px] transition-transform hover:-translate-y-1">
            <div className="relative h-full rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ring-1 mb-5 ${accent}`}>
                    {icon}
                </div>
                <h3 className={FEATURE_CARD_TITLE}>{title}</h3>
                {children}
            </div>
        </div>
    )
}
