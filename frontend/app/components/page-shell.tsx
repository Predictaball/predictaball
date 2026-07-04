import React from "react"
import { AMBIENT_GLOW } from "@/app/util/css-classes"

interface PageShellProps {
    children: React.ReactNode
    /** Extra classes for the <main> element (e.g. flex layout, padding). */
    className?: string
    /** Use `min-h-svh` instead of the default `min-h-screen` — pick whichever
     * the page already needs; this only centralises the shared chrome. */
    svh?: boolean
}

/**
 * Every top-level page shares this shell: a full-height <main> on the app's
 * base slate/gray surface with the same ambient radial-gradient wash behind
 * the content. Centralised so the app's atmosphere (colours, glow) can be
 * retuned in one place instead of copy-pasted across every page.
 */
export default function PageShell({children, className = "", svh = false}: PageShellProps): React.JSX.Element {
    return (
        <main className={`relative ${svh ? "min-h-svh" : "min-h-screen"} bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden ${className}`}>
            <div className={AMBIENT_GLOW}/>
            {children}
        </main>
    )
}
