import React from "react"
import {Chip, Match, Prediction} from "@/client"

const GLYPH: Partial<Record<Chip, string>> = {
    [Chip.DoublePoints]: "2×",
    [Chip.OneGoalOut]: "±1",
    [Chip.Crowd]: "%",
}

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
    // True when the chip earned points the user would not otherwise have had.
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
                helped: false,
                detail: base === 5 ? "Exact score — no nudge needed" : "No nudge could rescue points",
            }
        }
        case Chip.DoublePoints: {
            if (base > 0) {
                return {
                    chip: Chip.DoublePoints,
                    glyph: "2×",
                    helped: true,
                    delta: base,
                    detail: `Doubled ${base} pts to ${base * 2}`,
                }
            }
            return {chip: Chip.DoublePoints, glyph: "2×", helped: false, detail: "No points to double"}
        }
        case Chip.Crowd: {
            // The crowd pick has already been substituted into the stored score
            // at kickoff (MatchScoring.substituteCrowdPredictions).
            return {
                chip: Chip.Crowd,
                glyph: "Crowd",
                helped: base > 0,
                detail: `Locked in the crowd's ${home}–${away}`,
            }
        }
        default:
            return null
    }
}

// Where a chip's effect should be surfaced. Effects that change the *prediction*
// (the ±1 nudge, the crowd lock-in) attach to the prediction; effects that change
// the *points* (double points) attach to the points.
export interface ChipDisplay {
    // ±1 that paid off: render in place of the prediction score (original → adjusted).
    nudge?: {original: {home: number; away: number}; adjusted: {home: number; away: number}}
    // Small badge to sit beside the prediction score.
    predictionBadge?: {glyph: string; muted: boolean; title?: string}
    // Small badge to sit beside the points.
    pointsBadge?: {glyph: string; muted: boolean; title?: string}
}

export function chipDisplay(
    prediction: Prediction | undefined,
    match: Pick<Match, "homeScore" | "awayScore">,
): ChipDisplay {
    if (!prediction || prediction.chip === Chip.None) return {}
    const glyph = GLYPH[prediction.chip] ?? ""

    const impact = computeChipImpact(prediction, match)
    // No result yet — just mark which chip was played, beside the prediction.
    if (!impact) return {predictionBadge: {glyph, muted: false}}

    switch (prediction.chip) {
        case Chip.OneGoalOut:
            if (impact.adjusted && impact.original) {
                return {nudge: {original: impact.original, adjusted: impact.adjusted}}
            }
            return {predictionBadge: {glyph, muted: true, title: impact.detail}}
        case Chip.Crowd:
            return {predictionBadge: {glyph, muted: !impact.helped, title: impact.detail}}
        case Chip.DoublePoints:
            return {pointsBadge: {glyph, muted: !impact.helped, title: impact.detail}}
        default:
            return {}
    }
}

// Small bordered chip badge, consistent with the glyph badges used across the app.
export function ChipBadge({glyph, muted = false, title, className = ""}: {
    glyph: string
    muted?: boolean
    title?: string
    className?: string
}): React.JSX.Element {
    const tone = muted
        ? "border-slate-200 bg-slate-900/[0.04] text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-500"
        : "border-cyan-500/30 bg-cyan-500/15 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-300"
    return (
        <span title={title} className={`rounded border px-1.5 py-0.5 text-[9px] font-black leading-none ${tone} ${className}`}>
            {glyph}
        </span>
    )
}

// Renders a ±1 nudge inline with the prediction: original struck through, the
// adjusted score highlighted. Sizing/weight is inherited from `className`.
export function NudgeScore({original, adjusted, className = ""}: {
    original: {home: number; away: number}
    adjusted: {home: number; away: number}
    className?: string
}): React.JSX.Element {
    return (
        <span title={`Off by One nudged ${original.home}–${original.away} to ${adjusted.home}–${adjusted.away}`} className={`inline-flex items-center tabular-nums ${className}`}>
            <span className="line-through decoration-1 opacity-40">{original.home}–{original.away}</span>
            <span className="mx-1.5 inline-flex flex-col items-center leading-none text-cyan-500 dark:text-cyan-400" aria-label="off by one">
                <span className="text-[0.62em] font-black text-cyan-600 dark:text-cyan-300">±1</span>
                <span className="-mt-px text-[1.1em] leading-none">⟶</span>
            </span>
            <span className="text-cyan-600 dark:text-cyan-300">{adjusted.home}–{adjusted.away}</span>
        </span>
    )
}
