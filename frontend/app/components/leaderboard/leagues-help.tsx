import React from "react"
import HelpPopover from "@/app/components/help-popover"

export default function LeaguesHelp(): React.JSX.Element {
    return (
        <HelpPopover label="How leagues work">
            <p>A league is a group of players ranked together on the same leaderboard.</p>
            <ul className="space-y-1.5 pl-1">
                <li>
                    <span className="font-semibold text-slate-900 dark:text-white">Global</span> &mdash; everyone on Predictaball.
                </li>
                <li>
                    <span className="font-semibold text-slate-900 dark:text-white">Country</span> &mdash; everyone supporting the same team as you.
                </li>
                <li>
                    <span className="font-semibold text-slate-900 dark:text-white">Private</span> &mdash; create one, invite friends, stake a prize or invent a forfeit.
                </li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-gray-400">Your score is the same in every league &mdash; only the people you&apos;re ranked against change.</p>
        </HelpPopover>
    )
}
