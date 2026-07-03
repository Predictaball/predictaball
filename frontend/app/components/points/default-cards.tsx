import React from "react"

export default function DefaultCards(): React.JSX.Element {
    return (
        <div className="relative rounded-xl border-[1.5px] border-slate-300 dark:border-white/15 bg-white dark:bg-gray-900">
            <div className="rounded-xl px-6 py-7 sm:py-10 text-center">
                <div className="mx-auto h-12 sm:h-16 w-36 sm:w-48 rounded-lg bg-slate-900/10 dark:bg-white/10 animate-pulse"/>
                <div className="mt-2 mx-auto h-3 w-12 rounded bg-slate-900/10 dark:bg-white/10 animate-pulse"/>
                <div className="mt-5 flex items-center justify-center gap-3">
                    <div className="h-7 w-24 rounded-full bg-slate-900/10 dark:bg-white/10 animate-pulse"/>
                    <div className="h-7 w-20 rounded-full bg-slate-900/10 dark:bg-white/10 animate-pulse"/>
                </div>
            </div>
        </div>
    )
}
