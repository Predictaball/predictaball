import React from "react"
import {SECTION_EYEBROW} from "@/app/util/css-classes"

interface SectionHeadingProps {
    title: string
    count?: number
    action?: React.ReactNode
}

export default function SectionHeading({title, count, action}: SectionHeadingProps): React.JSX.Element {
    return (
        <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
                {/* Slim gradient tick anchors each section heading to the brand
                    palette and gives the understated eyebrow a touch more intent. */}
                <span aria-hidden className="h-3.5 w-1 rounded-full bg-gradient-to-b from-blue-500 via-cyan-400 to-teal-300"/>
                <h2 className={SECTION_EYEBROW}>{title}</h2>
                {count !== undefined && (
                    <span className="rounded-full bg-slate-900/5 dark:bg-white/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-500 dark:text-gray-400">
                        {count}
                    </span>
                )}
            </div>
            {action}
        </div>
    )
}
