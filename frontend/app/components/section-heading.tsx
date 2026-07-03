import React from "react"
import {CHYRON_TAB} from "@/app/util/css-classes"

interface SectionHeadingProps {
    title: string
    count?: number
    action?: React.ReactNode
}

/**
 * Section headings styled as broadcast chyrons: a solid green lower-third tab,
 * like a TV score bug's competition label, with the count riding alongside as
 * a scoreboard numeral.
 */
export default function SectionHeading({title, count, action}: SectionHeadingProps): React.JSX.Element {
    return (
        <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-stretch">
                <h2 className={`${CHYRON_TAB} ${count !== undefined ? "rounded-r-none" : ""}`}>{title}</h2>
                {count !== undefined && (
                    <span className="inline-flex items-center bg-slate-900/10 dark:bg-white/10 px-2 rounded-r-sm font-display text-sm font-bold tabular-nums text-slate-700 dark:text-gray-200">
                        {count}
                    </span>
                )}
            </div>
            {action}
        </div>
    )
}
