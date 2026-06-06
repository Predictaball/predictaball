import React from "react"

function dotStyle(points: number | null): string {
    if (points === 5) return "bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 text-gray-900"
    if (points === 2) return "bg-cyan-500/20 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300"
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
