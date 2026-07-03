import React from "react"

// Shared colour scale for a score, used by the recent-form dots here and the
// points pill on match cards so the two always agree: gold for a doubled exact
// score (10), amber for an exact score (5), indigo for a doubled outcome (4),
// blue for the right outcome (2), muted grey otherwise.
export function pointsColorClasses(points: number | null): string {
    if (points === 10) return "bg-yellow-400 text-yellow-900"
    if (points === 5) return "bg-amber-400 text-amber-900"
    if (points === 4) return "bg-indigo-500 text-white"
    if (points === 2) return "bg-blue-500/20 border border-blue-500/40 text-blue-700 dark:text-blue-300"
    return "bg-slate-900/10 dark:bg-white/10 text-slate-400 dark:text-gray-500"
}

// Ring colour for the highlighted latest dot, matched to that dot's own colour.
function ringStyle(points: number | null): string {
    if (points === 10) return "ring-yellow-400"
    if (points === 5) return "ring-amber-400"
    if (points === 4) return "ring-indigo-400"
    if (points === 2) return "ring-blue-400"
    return "ring-slate-400 dark:ring-gray-500"
}

export default function FormBadge({form, highlightLatest = false}: {form: (number | null)[], highlightLatest?: boolean}) {
    // Incoming form is most-recent-first; render it reversed so the most recent score sits on the right.
    const ordered = [...form].reverse()
    const latestIndex = ordered.length - 1
    return (
        <div className="flex items-center gap-1">
            {ordered.map((pts, i) => (
                <div key={i} className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${pointsColorClasses(pts)} ${highlightLatest && i === latestIndex ? `ring-2 ${ringStyle(pts)} ring-offset-2 ring-offset-slate-50 dark:ring-offset-gray-900` : ""}`}>
                    {pts ?? 0}
                </div>
            ))}
        </div>
    )
}
