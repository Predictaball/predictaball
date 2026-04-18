import React from "react"

export default function DefaultCards(): React.JSX.Element {
    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
            <div className="rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-sm px-6 py-7 sm:py-10 text-center">
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
