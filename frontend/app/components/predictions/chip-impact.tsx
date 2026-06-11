import React from "react"
import {Chip, Match, Prediction} from "@/client"

// Mirrors PointsCalculator.calculateDefaultPoints on the backend
// (lambdas/src/main/kotlin/scorcerer/utils/PointsCalculator.kt): 5 for an
// exact score, 2 for the right outcome, 0 otherwise.
function defaultPoints(home: number, away: number, resultHome: number, resultAway: number): number {
    if (home === resultHome && away === resultAway) return 5
    if (home < away && resultHome < resultAway) return 2
    if (home > away && resultHome > resultAway) return 2
    if (home === away && resultHome === resultAway) return 2
    return 0
}

export interface ChipImpact {
    chip: Chip
    glyph: string
    label: string
    // True when the chip earned the user points they would not otherwise have had.
    helped: boolean
    // Plain-language explanation, suitable for a tooltip.
    detail: string
    // For the ±1 chip: the score the chip nudged the prediction to (when it helped).
    original?: {home: number; away: number}
    adjusted?: {home: number; away: number}
    // Points the chip rescued versus playing the same prediction with no chip.
    delta?: number
}

// Reconstructs what a played chip did to a user's score. The backend stores
// only the original prediction and the final points, not the adjusted score
// the ±1 chip used, so we recompute it here from the prediction + match result.
// Returns null when there is nothing to show (no chip, or no result yet).
export function computeChipImpact(
    prediction: Prediction | undefined,
    match: Pick<Match, "homeScore" | "awayScore">,
): ChipImpact | null {
    if (!prediction || prediction.chip === Chip.None) return null

    const resultHome = match.homeScore
    const resultAway = match.awayScore
    if (resultHome === undefined || resultAway === undefined) return null

    const home = prediction.homeScore
    const away = prediction.awayScore
    const base = defaultPoints(home, away, resultHome, resultAway)

    switch (prediction.chip) {
        case Chip.OneGoalOut: {
            // Mirrors PointsCalculator.calculatePointsOneGoalOut: the best of four
            // single-goal adjustments, never scoring below the original prediction.
            const candidates = [
                {home: home + 1, away},
                {home: Math.max(0, home - 1), away},
                {home, away: away + 1},
                {home, away: Math.max(0, away - 1)},
            ]
            let best = candidates[0]
            let bestPoints = defaultPoints(best.home, best.away, resultHome, resultAway)
            for (const candidate of candidates) {
                const points = defaultPoints(candidate.home, candidate.away, resultHome, resultAway)
                // Prefer more points; on a tie, prefer the exact result for the clearest story.
                const isExact = candidate.home === resultHome && candidate.away === resultAway
                const bestIsExact = best.home === resultHome && best.away === resultAway
                if (points > bestPoints || (points === bestPoints && isExact && !bestIsExact)) {
                    best = candidate
                    bestPoints = points
                }
            }
            if (bestPoints > base) {
                return {
                    chip: Chip.OneGoalOut,
                    glyph: "±1",
                    label: "Off by One",
                    helped: true,
                    original: {home, away},
                    adjusted: {home: best.home, away: best.away},
                    delta: bestPoints - base,
                    detail: `Nudged your ${home}–${away} to ${best.home}–${best.away} for +${bestPoints - base} pts`,
                }
            }
            return {
                chip: Chip.OneGoalOut,
                glyph: "±1",
                label: "Off by One",
                helped: false,
                detail: base === 5 ? "Exact score — no nudge needed" : "No nudge could rescue points",
            }
        }
        case Chip.DoublePoints: {
            if (base > 0) {
                return {
                    chip: Chip.DoublePoints,
                    glyph: "2×",
                    label: "Double Points",
                    helped: true,
                    delta: base,
                    detail: `Doubled ${base} pts to ${base * 2}`,
                }
            }
            return {
                chip: Chip.DoublePoints,
                glyph: "2×",
                label: "Double Points",
                helped: false,
                detail: "No points to double",
            }
        }
        case Chip.Crowd: {
            // The crowd pick has already been substituted into the stored score
            // at kickoff (MatchScoring.substituteCrowdPredictions).
            return {
                chip: Chip.Crowd,
                glyph: "Crowd",
                label: "Follow the Crowd",
                helped: base > 0,
                detail: `Locked in the crowd's ${home}–${away}`,
            }
        }
        default:
            return null
    }
}

// Compact pill explaining what a played chip did to the score. For the ±1 chip
// it shows the original → adjusted nudge; otherwise a short summary line.
export function ChipImpactNote({impact, className = ""}: {
    impact: ChipImpact
    className?: string
}): React.JSX.Element {
    const accent = impact.helped
        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300"
        : "border-slate-200 bg-slate-900/[0.03] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400"

    return (
        <span
            title={impact.detail}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${accent} ${className}`}
        >
            <span className="font-black tabular-nums">{impact.glyph}</span>
            {impact.adjusted && impact.original ? (
                <span className="tabular-nums">
                    {impact.original.home}–{impact.original.away}
                    <span className="px-1 opacity-60">→</span>
                    {impact.adjusted.home}–{impact.adjusted.away}
                </span>
            ) : (
                <span>{impact.detail}</span>
            )}
            {impact.delta !== undefined && impact.delta > 0 && (
                <span className="font-black tabular-nums">+{impact.delta}</span>
            )}
        </span>
    )
}
