import React from "react"

type Accent = "blue" | "cyan" | "green"

interface StatCardProps {
    label: string
    value: React.ReactNode
    accent?: Accent
    emphasized?: boolean
    pulse?: boolean
}

const ACCENT_DOT: Record<Accent, string> = {
    blue: "bg-blue-400",
    cyan: "bg-cyan-300",
    green: "bg-green-300",
}

export default function StatCard({label, value, accent = "cyan", emphasized, pulse}: StatCardProps): React.JSX.Element {
    return (
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px]">
            <div className="rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm h-full px-3 sm:px-5 py-4 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${ACCENT_DOT[accent]} ${pulse ? "animate-pulse" : ""}`}/>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">{label}</span>
                </div>
                <div className={`font-black leading-none ${emphasized ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"} bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 dark:from-blue-400 dark:via-cyan-300 dark:to-green-300 bg-clip-text text-transparent`}>
                    {value}
                </div>
            </div>
        </div>
    )
}
