"use client"

import React, { useEffect, useState } from "react"
import { BracketMatch } from "@/client"
import { ROUND_LABELS, ROUND_SHORT_LABELS } from "@/app/util/bracket-scoring"
import { RoundColumn, Slot, buildBracket } from "@/app/util/bracket-layout"
import BracketCell, { CellDims, LockIcon, PlaceholderCell, isMatchLocked } from "./bracket-cell"

// Desktop tree geometry.
const CARD_W = 188
const CARD_H = 56
const COL_GAP = 46
const V_GAP = 16
const HEADER_H = 26
const COL = CARD_W + COL_GAP
const SLOT = CARD_H + V_GAP

interface BracketTreeProps {
    matches: BracketMatch[]
}

function useCompact(): boolean {
    const [compact, setCompact] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 640px)")
        const update = (): void => setCompact(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    return compact
}

/**
 * A round can't be predicted yet (header padlock) when none of its real matches
 * are open — i.e. every match is a future placeholder or a locked upcoming tie,
 * with nothing live, completed, or currently predictable.
 */
function isRoundLocked(column: RoundColumn<BracketMatch>): boolean {
    return !column.slots.some(
        (s) => s.kind === "match" && (s.match.state !== "UPCOMING" || s.match.predictable),
    )
}

/**
 * The user's knockout run. On desktop it's a left-to-right single-elimination
 * tree with connectors; on phones it's a horizontal snap carousel — one round
 * per swipe — capped to a scrollable viewport so it stays short. Touch is axis
 * locked: you swipe left/right to move between rounds and scroll up/down freely
 * within the tree, but it can't be dragged diagonally in every direction. Matches
 * that are in the bracket but not yet open for predictions are greyed out and
 * padlocked.
 */
export default function BracketTree({ matches }: BracketTreeProps): React.JSX.Element {
    const compact = useCompact()
    const rounds = buildBracket(matches)

    return compact
        ? <MobileCarousel rounds={rounds} />
        : <DesktopTree rounds={rounds} />
}

function renderSlot(slot: Slot<BracketMatch>, dims: CellDims): React.JSX.Element {
    if (slot.kind === "placeholder") {
        return <PlaceholderCell dims={dims} home={slot.home} away={slot.away} />
    }
    return <BracketCell match={slot.match} locked={isMatchLocked(slot.match)} dims={dims} />
}

function slotKey(slot: Slot<BracketMatch>): string {
    return slot.kind === "match" ? slot.match.matchId : slot.id
}

// Mobile bracket geometry
const M_CARD_H = 56
const M_V_GAP = 12
const M_SLOT = M_CARD_H + M_V_GAP
const M_CONNECTOR_W = 28
const M_HEADER_H = 28

/** Returns the vertical centre of each cell in a round column given its match count. */
function mobileCenters(matchCount: number, totalSlots: number): number[] {
    // Cells are evenly distributed over the same total height as the first round.
    return Array.from({ length: matchCount }, (_, i) =>
        (totalSlots * M_SLOT * (i + 0.5)) / matchCount
    )
}

/** Phone layout: snap-scroll carousel with proper bracket connector lines. */
function MobileCarousel({ rounds }: { rounds: RoundColumn<BracketMatch>[] }): React.JSX.Element {
    const firstRoundCount = rounds[0].slots.length
    const totalH = firstRoundCount * M_SLOT - M_V_GAP
    const innerH = totalH + M_HEADER_H

    const centersByRound: number[][] = rounds.map((col) =>
        mobileCenters(col.slots.length, firstRoundCount)
    )

    // Two nested scrollers with complementary touch-action lock each gesture to a
    // single axis, so the bracket can't be dragged diagonally in all directions.
    // The outer scroller owns vertical scrolling (pan-y): a downward swipe scrolls
    // the whole tree, connectors and all, staying aligned. The inner scroller owns
    // horizontal swiping (pan-x) and snaps one round per swipe. A vertical gesture
    // isn't permitted on the inner, so the browser routes it up to the outer; a
    // horizontal gesture isn't permitted on the outer, so it snaps rounds instead.
    // Capped to a fraction of the viewport so the tall first round shrinks into a
    // contained, scrollable area instead of dominating the page.
    return (
        <div
            className="-mx-4 overflow-y-auto overflow-x-hidden overscroll-contain px-4"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", maxHeight: `min(${innerH}px, 70svh)` }}
        >
        <div
            className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x", gap: 0, height: innerH }}
        >
            {rounds.map((column, r) => {
                const locked = isRoundLocked(column)
                const centers = centersByRound[r]
                const prevCenters = r > 0 ? centersByRound[r - 1] : null
                const dims: CellDims = { width: "100%", height: M_CARD_H, compact: true }

                return (
                    <React.Fragment key={column.round}>
                        {prevCenters && (
                            <div className="shrink-0 self-start" style={{ width: M_CONNECTOR_W, paddingTop: M_HEADER_H }}>
                                <svg width={M_CONNECTOR_W} height={totalH} fill="none" aria-hidden className="pointer-events-none">
                                    {centers.map((cy, j) => {
                                        const f1 = prevCenters[2 * j]
                                        const f2 = prevCenters[2 * j + 1]
                                        if (f1 == null || f2 == null) return null
                                        const midY = (f1 + f2) / 2
                                        return (
                                            <path
                                                key={j}
                                                d={`M 0 ${f1} H ${M_CONNECTOR_W / 2} V ${f2} H 0 M ${M_CONNECTOR_W / 2} ${midY} H ${M_CONNECTOR_W}`}
                                                className="stroke-slate-300 dark:stroke-white/20"
                                                strokeWidth={1.5}
                                            />
                                        )
                                    })}
                                </svg>
                            </div>
                        )}

                        <section className="flex shrink-0 snap-center flex-col" style={{ width: "72vw", maxWidth: 300 }}>
                            <header
                                className="sticky top-0 z-10 flex shrink-0 items-center justify-center gap-1.5 bg-slate-50/95 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 backdrop-blur dark:bg-gray-900/95 dark:text-gray-400"
                                style={{ height: M_HEADER_H }}
                            >
                                {ROUND_LABELS[column.round]}
                                {locked && <LockIcon className="h-3 w-3 text-slate-400 dark:text-gray-500" />}
                            </header>

                            <div className="relative" style={{ height: totalH }}>
                                {column.slots.map((slot, j) => (
                                    <div
                                        key={slotKey(slot)}
                                        className="absolute w-full"
                                        style={{ top: centers[j] - M_CARD_H / 2 }}
                                    >
                                        {renderSlot(slot, dims)}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </React.Fragment>
                )
            })}
            <div className="shrink-0" style={{ width: 16 }} />
        </div>
        </div>
    )
}

/** Desktop layout: the connected bracket tree. */
function DesktopTree({ rounds }: { rounds: RoundColumn<BracketMatch>[] }): React.JSX.Element {
    const dims: CellDims = { width: CARD_W, height: CARD_H, compact: false }
    const totalHeight = rounds[0].slots.length * SLOT

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
        <div className="-mx-4 overflow-x-auto px-4 pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
            <div style={{ width }}>
                <div className="relative" style={{ height: HEADER_H }}>
                    {rounds.map((column, r) => (
                        <div
                            key={column.round}
                            className="absolute flex items-center justify-center gap-1 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400"
                            style={{ left: r * COL, width: CARD_W }}
                        >
                            {ROUND_SHORT_LABELS[column.round]}
                            {isRoundLocked(column) && <LockIcon className="h-3 w-3 text-slate-400 dark:text-gray-500" />}
                        </div>
                    ))}
                </div>

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
    )
}
