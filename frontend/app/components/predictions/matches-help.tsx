import React from "react"
import HelpPopover from "@/app/components/help-popover"

export default function MatchesHelp(): React.JSX.Element {
    return (
        <HelpPopover label="How matches work">
            <p>You can predict every match of the World Cup &mdash; we just show you the next three match days at a time so it stays manageable. Come back daily to lock in your next set.</p>
            <ul className="space-y-1.5 pl-1">
                <li>
                    <span className="font-mono font-bold text-pitch-700 dark:text-pitch-300">5pt</span> &mdash; exact score
                </li>
                <li>
                    <span className="font-mono font-bold text-pitch-700 dark:text-pitch-300">2pt</span> &mdash; correct result
                </li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-gray-400">Knockouts use an updated scoring system.</p>
        </HelpPopover>
    )
}
