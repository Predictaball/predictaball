"use client"

import React, { useEffect, useState } from "react"
import { BracketMatch } from "@/client"
import { BracketRound, KNOCKOUT_ROUNDS, ROUND_LABELS, ROUND_SHORT_LABELS } from "@/app/util/bracket-scoring"
import BracketCell, { CellDims, LockIcon } from "./bracket-cell"

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

interface RoundColumn {
    round: BracketRound
    matches: BracketMatch[]
}

function useCompact(): boolean {
    // Start at false so the first client render matches the server HTML, then
    // adopt the real breakpoint on mount.
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

function groupRounds(matches: BracketMatch[]): RoundColumn[] {
    const byRound = new Map<BracketRound, BracketMatch[]>()
    for (const match of matches) {
        const round = match.round as BracketRound
        const bucket = byRound.get(round)
        if (bucket) bucket.push(match)
        else byRound.set(round, [match])
    }
    return KNOCKOUT_ROUNDS.filter((round) => byRound.has(round)).map((round) => ({ round, matches: byRound.get(round)! }))
}

/**
 * The user's knockout run. On desktop it's a left-to-right single-elimination
 * tree with connectors; on phones it's a horizontal snap carousel — one round
 * per swipe, each round a compact scrollable list so it stays short vertically.
 * Rounds beyond the one currently being played are locked (greyed + padlock).
 */
export default function BracketTree({ matches }: BracketTreeProps): React.JSX.Element {
    const compact = useCompact()
    const rounds = groupRounds(matches)

    if (rounds.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-900/15 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-gray-400">
                The knockout rounds haven&apos;t started yet. Your bracket will appear here once the Round of 32 is set.
            </div>
        )
    }

    // The earliest round still being played is "open"; later rounds are locked.
    const openRoundIndex = rounds.findIndex((column) => column.matches.some((m) => m.state !== "COMPLETED"))
    const isLocked = (r: number): boolean => openRoundIndex !== -1 && r > openRoundIndex

    return compact
        ? <MobileCarousel rounds={rounds} isLocked={isLocked} />
        : <DesktopTree rounds={rounds} isLocked={isLocked} />
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
function MobileCarousel({ rounds, isLocked }: { rounds: RoundColumn[]; isLocked: (r: number) => boolean }): React.JSX.Element {
    const firstRoundCount = rounds[0].matches.length
    // Total height is driven by the first (largest) round
    const totalH = firstRoundCount * M_SLOT - M_V_GAP

    // Pre-compute vertical centres per round
    const centersByRound: number[][] = rounds.map((col) =>
        mobileCenters(col.matches.length, firstRoundCount)
    )

    return (
        <div
            className="-mx-4 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden px-4"
            style={{ WebkitOverflowScrolling: "touch", gap: 0 }}
        >
            {rounds.map((column, r) => {
                const locked = isLocked(r)
                const centers = centersByRound[r]
                const prevCenters = r > 0 ? centersByRound[r - 1] : null
                const dims: CellDims = { width: "100%", height: M_CARD_H, compact: true }

                return (
                    <React.Fragment key={column.round}>
                        {/* Connector SVG strip between rounds */}
                        {prevCenters && (
                            <div className="shrink-0 self-start" style={{ width: M_CONNECTOR_W, paddingTop: M_HEADER_H }}>
                                <svg
                                    width={M_CONNECTOR_W}
                                    height={totalH}
                                    fill="none"
                                    aria-hidden
                                    className="pointer-events-none"
                                >
                                    {centers.map((cy, j) => {
                                        const f1 = prevCenters[2 * j]
                                        const f2 = prevCenters[2 * j + 1]
                                        if (f1 == null || f2 == null) return null
                                        const midY = (f1 + f2) / 2
                                        // horizontal from right edge of prev card, then vertical to merge, then horizontal to left edge of next card
                                        return (
                                            <path
                                                key={j}
                                                d={`M 0 ${f1} H ${M_CONNECTOR_W / 2} V ${f2} M ${M_CONNECTOR_W / 2} ${midY} H ${M_CONNECTOR_W}`}
                                                className="stroke-slate-300 dark:stroke-white/20"
                                                strokeWidth={1.5}
                                            />
                                        )
                                    })}
                                </svg>
                            </div>
                        )}

                        {/* Round column */}
                        <section
                            className="flex shrink-0 snap-center flex-col"
                            style={{ width: "72vw", maxWidth: 300 }}
                        >
                            <header className="flex shrink-0 items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400" style={{ height: M_HEADER_H }}>
                                {ROUND_LABELS[column.round]}
                                {locked && <LockIcon className="h-3 w-3 text-slate-400 dark:text-gray-500" />}
                            </header>

                            {/* Matches pinned at their bracket positions */}
                            <div className="relative" style={{ height: totalH }}>
                                {column.matches.map((match, j) => (
                                    <div
                                        key={match.matchId}
                                        className="absolute w-full"
                                        style={{ top: centers[j] - M_CARD_H / 2 }}
                                    >
                                        <BracketCell match={match} locked={locked} dims={dims} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </React.Fragment>
                )
            })}
            {/* Right padding sentinel */}
            <div className="shrink-0" style={{ width: 16 }} />
        </div>
    )
}

/** Desktop layout: the connected bracket tree. */
function DesktopTree({ rounds, isLocked }: { rounds: RoundColumn[]; isLocked: (r: number) => boolean }): React.JSX.Element {
    const dims: CellDims = { width: CARD_W, height: CARD_H, compact: false }
    const totalHeight = rounds[0].matches.length * SLOT

    // Vertical centre of every cell, round by round (positional adjacency).
    const centers: number[][] = []
    rounds.forEach((column, r) => {
        if (r === 0) {
            centers.push(column.matches.map((_, i) => i * SLOT + SLOT / 2))
            return
        }
        const prev = centers[r - 1]
        const pairs = prev.length === 2 * column.matches.length
        centers.push(
            column.matches.map((_, j) =>
                pairs ? (prev[2 * j] + prev[2 * j + 1]) / 2 : (totalHeight * (j + 0.5)) / column.matches.length,
            ),
        )
    })

    const width = rounds.length * COL - COL_GAP

    // Elbow connectors from each pair of feeders into the next match.
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
                            className="absolute text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400"
                            style={{ left: r * COL, width: CARD_W }}
                        >
                            {ROUND_SHORT_LABELS[column.round]}
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
                        column.matches.map((match, j) => (
                            <div key={match.matchId} className="absolute" style={{ left: r * COL, top: centers[r][j] - CARD_H / 2, width: CARD_W }}>
                                <BracketCell match={match} locked={isLocked(r)} dims={dims} />
                            </div>
                        )),
                    )}
                </div>
            </div>
        </div>
    )
}
