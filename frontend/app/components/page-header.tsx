import React from "react"
import BackButton from "@/app/components/back-button"
import Wordmark from "@/app/components/wordmark"

/**
 * Shared header for every authenticated sub-page (history, standings, profile):
 * a back button on the left, the wordmark centred, and a matching spacer so the
 * wordmark stays optically centred. It sticks to the top of the viewport behind
 * a translucent, blurred bar so content scrolls cleanly underneath — the same
 * frosted-chrome treatment used on the main app screen.
 *
 * The negative inline margins let the frosted bar bleed to the edges of the
 * page's content column while the inner row keeps the column's padding.
 */
export default function PageHeader(): React.JSX.Element {
    return (
        <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 -mt-6 px-4 sm:px-6 py-3 border-b border-slate-200/60 bg-slate-50/75 backdrop-blur-md dark:border-white/5 dark:bg-gray-900/75">
            <div className="relative flex items-center justify-between">
                <BackButton/>
                <Wordmark className="hidden sm:flex absolute left-1/2 -translate-x-1/2"/>
                <div className="w-10"/>
            </div>
        </header>
    )
}
