import React from "react"

function dotStyle(points: number | null): string {
    if (points === 10) return "bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-yellow-900 shadow-sm shadow-amber-400/50"
    if (points === 5) return "bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 text-amber-900"
    if (points === 4) return "bg-gradient-to-br from-blue-400 via-indigo-400 to-violet-400 text-white"
    if (points === 2) return "bg-blue-500/20 border border-blue-500/40 text-blue-700 dark:text-blue-300"
    return "bg-slate-900/10 dark:bg-white/10 text-slate-400 dark:text-gray-500"
}

export default function FormBadge({form}: {form: (number | null)[]}) {
    return (
        <div className="flex items-center gap-1">
            {form.map((pts, i) => (
                <div key={i} className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${dotStyle(pts)}`}>
                    {pts ?? 0}
                </div>
            ))}
        </div>
    )
}
