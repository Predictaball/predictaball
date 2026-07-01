import React from "react"
import Link from "next/link"
import { Bracket, BracketMatch } from "@/client"
import { RoundColumn, Slot, buildBracket } from "@/app/util/bracket-layout"
import { ROUND_SHORT_LABELS } from "@/app/util/bracket-scoring"
import BracketCell, { CellDims, PlaceholderCell, isMatchLocked } from "./bracket-cell"

// Compact geometry — small enough to sit in a dashboard card, wide enough to
// read as a bracket. Two columns fit every phone width, so the preview only ever
// scrolls vertically (the round of 32 is tall).
const CARD_W = 136
const CARD_H = 40
const COL_GAP = 16
const V_GAP = 8
const HEADER_H = 22
const COL = CARD_W + COL_GAP
const SLOT = CARD_H + V_GAP

// The opening two rounds — round of 32 and round of 16. buildBracket always
// returns all five rounds (padded with placeholders), so the head is deterministic.
const PREVIEW_ROUNDS = 2
// The round of 32 is 16 ties tall; cap the body so the dashboard card stays
// compact and let the rest scroll vertically.
const MAX_BODY_H = 240

function slotKey(slot: Slot<BracketMatch>): string {
    return slot.kind === "match" ? slot.match.matchId : slot.id
}

function renderSlot(slot: Slot<BracketMatch>, dims: CellDims): React.JSX.Element {
    if (slot.kind === "placeholder") {
        return <PlaceholderCell dims={dims} home={slot.home} away={slot.away} />
    }
    // Non-interactive: the whole card is a single link to the full bracket, so a
    // per-cell anchor would nest inside it.
    return <BracketCell match={slot.match} locked={isMatchLocked(slot.match)} dims={dims} interactive={false} />
}

/**
 * A condensed, non-interactive glimpse of the viewer's Knockout Cup run for the
 * dashboard: the opening two rounds (round of 32 and round of 16) of their
 * personal bracket plus their running points and streak, framed in the cup's warm
 * amber so it reads as the side-game entry point. The whole card links through to
 * the full run at `/app/bracket`.
 */
export default function BracketPreview({ bracket }: { bracket: Bracket }): React.JSX.Element {
    const rounds: RoundColumn<BracketMatch>[] = buildBracket(bracket.matches).slice(0, PREVIEW_ROUNDS)
    const dims: CellDims = { width: CARD_W, height: CARD_H, compact: true }
    const totalHeight = rounds[0].slots.length * SLOT

    // Same centring rule as the full desktop tree: the tallest (first) round is
    // evenly spaced, each later round sits at the midpoint of the pair feeding it.
    const centers: number[][] = []
    rounds.forEach((column, r) => {
        if (r === 0) {
            centers.push(column.slots.map((_, i) => i * SLOT + SLOT / 2))
            return
        }
        const prev = centers[r - 1]
        const pairs = prev.length === 2 * column.slots.length
        centers.push(
            column.slots.map((_, j) =>
                pairs ? (prev[2 * j] + prev[2 * j + 1]) / 2 : (totalHeight * (j + 0.5)) / column.slots.length,
            ),
        )
    })

    const width = rounds.length * COL - COL_GAP

    const connectors: string[] = []
    for (let r = 1; r < rounds.length; r++) {
        const prev = centers[r - 1]
        const cur = centers[r]
        if (prev.length !== 2 * cur.length) continue
        const xPrevRight = (r - 1) * COL + CARD_W
        const xCurLeft = r * COL
        const midX = (xPrevRight + xCurLeft) / 2
        cur.forEach((my, j) => {
            const f1 = prev[2 * j]
            const f2 = prev[2 * j + 1]
            connectors.push(`M ${xPrevRight} ${f1} H ${midX} M ${xPrevRight} ${f2} H ${midX} M ${midX} ${f1} V ${f2} M ${midX} ${my} H ${xCurLeft}`)
        })
    }

    return (
        <Link
            href="/app/bracket"
            className="group relative block rounded-3xl bg-gradient-to-br from-amber-400/40 via-orange-400/20 to-amber-500/10 p-[1px] shadow-xl shadow-orange-500/10 transition-shadow duration-300 hover:shadow-2xl hover:shadow-orange-500/20"
        >
            <div className="space-y-4 rounded-3xl bg-white/70 p-4 backdrop-blur-sm dark:bg-white/[0.03] sm:p-5">
                <div className="flex items-center gap-3">
                    <div aria-hidden className="text-2xl sm:text-3xl">🏆</div>
                    <div className="min-w-0 flex-1">
                        <div className="font-display text-lg font-black tracking-tight">Knockout Cup</div>
                        <p className="text-xs text-slate-600 dark:text-gray-400">Your road to lifting the cup</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-center">
                        <div>
                            <div className="font-display text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">{bracket.totalPoints}</div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">pts</div>
                        </div>
                        <div>
                            <div className="font-display text-xl font-black tabular-nums text-slate-900 dark:text-white">
                                {bracket.currentStreak > 1 && <span aria-hidden className="mr-0.5 text-base">🔥</span>}
                                {bracket.currentStreak}
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">streak</div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto" style={{ width }}>
                    <div className="relative" style={{ height: HEADER_H }}>
                        {rounds.map((column, r) => (
                            <div
                                key={column.round}
                                className="absolute text-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400"
                                style={{ left: r * COL, width: CARD_W }}
                            >
                                {ROUND_SHORT_LABELS[column.round]}
                            </div>
                        ))}
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: MAX_BODY_H, WebkitOverflowScrolling: "touch" }}>
                        <div className="relative" style={{ width, height: totalHeight }}>
                            <svg className="pointer-events-none absolute inset-0" width={width} height={totalHeight} fill="none" aria-hidden>
                                {connectors.map((d, i) => (
                                    <path key={i} d={d} className="stroke-slate-300 dark:stroke-white/20" strokeWidth={1.5} />
                                ))}
                            </svg>
                            {rounds.map((column, r) =>
                                column.slots.map((slot, j) => (
                                    <div
                                        key={slotKey(slot)}
                                        className="absolute"
                                        style={{ left: r * COL, top: centers[r][j] - CARD_H / 2, width: CARD_W }}
                                    >
                                        {renderSlot(slot, dims)}
                                    </div>
                                )),
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <span>View your full run</span>
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </div>
            </div>
        </Link>
    )
}
