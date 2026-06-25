'use client'

import React, {useMemo} from "react"
import Link from "next/link"
import type {MultiPolygon, Polygon, Position} from "geojson"
import {MatchStateEnum} from "@/client"
import {resolveStadium, Stadium} from "./stadium-coords"
import {getCountryGeometry} from "./globe-utils"
import {flagSrc, flagFallbackSrc} from "@/app/util/flag"

// Swap to the fallback proxy once if flagcdn fails to serve the flag.
function handleFlagError(code: string, resolution: string) {
    return (event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget
        if (img.dataset.fallback) return
        img.dataset.fallback = "1"
        img.src = flagFallbackSrc(code, resolution)
    }
}

// One fixture in a group, reduced to what the map and match list need to plot
// and describe it, and link it to its match page.
export type GroupMatch = {
    matchId: string
    homeTeam: string
    homeFlagCode: string
    awayTeam: string
    awayFlagCode: string
    venue: string
    datetime: Date
    state: MatchStateEnum
    homeScore?: number
    awayScore?: number
}

// The three World Cup 2026 host nations whose outlines we draw.
const HOST_CODES = ["us", "ca", "mx"]

// Geographic window framing all host venues, used when a group's fixtures
// don't resolve to any known stadium (so the map still shows something sane).
const FULL_HOST_VIEW = {lngMin: -127, lngMax: -65, latMin: 13.5, latMax: 54}

type View = typeof FULL_HOST_VIEW

const VIEW_WIDTH = 1000
const PADDING = 28

// Marker / label sizing, in viewBox units.
const DOT_RADIUS = 6
const LABEL_GAP = 12
const NAME_FONT = 18
const CITY_FONT = 13
const LABEL_PAD_X = 9
const LABEL_HEIGHT = 42
const SEPARATION_PADDING = 6
const SEPARATION_ITERATIONS = 80
const ANCHOR_SPRING = 0.05

// Match pill sizing (the clickable "flag v flag" badge above each venue).
const PILL_WIDTH = 112
const PILL_HEIGHT = 34
const PILL_GAP = 6

// Standard Mercator, lng/lat in degrees -> planar units (x east, y north).
function mercator(lng: number, lat: number): [number, number] {
    return [lng * Math.PI / 180, Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2))]
}

// Tight geographic window around the venues actually hosting this group's
// fixtures, so the map zooms to where the action is rather than always
// showing the full host footprint. Falls back to the full view when no
// fixture resolves to a known stadium.
function computeView(stadiums: Stadium[]): View {
    if (stadiums.length === 0) return FULL_HOST_VIEW
    let lngMin = Infinity, lngMax = -Infinity, latMin = Infinity, latMax = -Infinity
    for (const s of stadiums) {
        if (s.lng < lngMin) lngMin = s.lng
        if (s.lng > lngMax) lngMax = s.lng
        if (s.lat < latMin) latMin = s.lat
        if (s.lat > latMax) latMax = s.lat
    }
    // Padding scales with the spread of venues, with a floor so a single-city
    // group still shows enough surrounding context (and room for labels/pills).
    const lngPad = Math.max((lngMax - lngMin) * 0.4, 5)
    const latPad = Math.max((latMax - latMin) * 0.4, 4)
    return {lngMin: lngMin - lngPad, lngMax: lngMax + lngPad, latMin: latMin - latPad, latMax: latMax + latPad}
}

// Projects a geographic window into the padded viewBox at a single (true
// Mercator) scale, so country shapes aren't distorted. Anything outside the
// view projects outside the viewBox and is clipped.
function makeProjection(view: View) {
    const [xMin] = mercator(view.lngMin, 0)
    const [xMax] = mercator(view.lngMax, 0)
    const yTop = mercator(0, view.latMax)[1]
    const yBot = mercator(0, view.latMin)[1]
    const scale = (VIEW_WIDTH - 2 * PADDING) / (xMax - xMin)
    const height = (yTop - yBot) * scale + 2 * PADDING
    const project = (lng: number, lat: number): [number, number] => {
        const [x, y] = mercator(lng, lat)
        return [PADDING + (x - xMin) * scale, PADDING + (yTop - y) * scale]
    }
    return {project, height}
}

function ringToPath(ring: Position[], project: (lng: number, lat: number) => [number, number]): string {
    let d = ""
    for (let i = 0; i < ring.length; i++) {
        const [x, y] = project(ring[i][0], ring[i][1])
        d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    }
    return d + "Z"
}

// Whether a ring is worth drawing: dropped if it lies entirely outside the view
// window or wraps the antimeridian (the Aleutians), which would otherwise streak
// a line across the map.
function ringVisible(ring: Position[], view: View): boolean {
    let lngMin = Infinity, lngMax = -Infinity, latMin = Infinity, latMax = -Infinity
    for (const [lng, lat] of ring) {
        if (lng < lngMin) lngMin = lng
        if (lng > lngMax) lngMax = lng
        if (lat < latMin) latMin = lat
        if (lat > latMax) latMax = lat
    }
    if (lngMax - lngMin > 180) return false
    const M = 6
    if (lngMax < view.lngMin - M || lngMin > view.lngMax + M) return false
    if (latMax < view.latMin - M || latMin > view.latMax + M) return false
    return true
}

function geometryToPath(geom: Polygon | MultiPolygon, project: (lng: number, lat: number) => [number, number], view: View): string {
    const polygons = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates
    return polygons
        .map(poly => poly.filter(ring => ringVisible(ring, view)).map(ring => ringToPath(ring, project)).join(""))
        .join("")
}

type VenueLabel = {
    stadium: Stadium
    matches: GroupMatch[]
    x: number
    y: number
    w: number
    h: number
    cx: number
    cy: number
}

// Collapses the group's fixtures to distinct venues we can place, projecting each
// to viewBox coordinates and keeping every fixture hosted there (a venue can host
// more than one match in a group). Fixtures whose venue we can't resolve are
// dropped from the map (they still appear in the match list).
function resolveVenues(matches: GroupMatch[], project: (lng: number, lat: number) => [number, number]): VenueLabel[] {
    const byCity = new Map<string, {stadium: Stadium; matches: GroupMatch[]}>()
    for (const m of matches) {
        const stadium = resolveStadium(m.venue)
        if (!stadium) continue
        const entry = byCity.get(stadium.city)
        if (entry) entry.matches.push(m)
        else byCity.set(stadium.city, {stadium, matches: [m]})
    }
    return [...byCity.values()].map(({stadium, matches}) => {
        const [x, y] = project(stadium.lng, stadium.lat)
        const nameW = Math.max(stadium.name.length * (NAME_FONT * 0.56), stadium.city.length * (CITY_FONT * 0.6)) + 2 * LABEL_PAD_X
        const w = Math.max(nameW, PILL_WIDTH)
        const h = LABEL_HEIGHT + matches.length * (PILL_HEIGHT + PILL_GAP)
        return {stadium, matches, x, y, w, h, cx: x, cy: y - LABEL_GAP - h / 2}
    })
}

// Nudges the venue boxes (name label + its stack of match pills) apart so they
// don't overlap, while a light spring keeps each one tugged back above its own
// dot. Pure 2D layout — no zoom, no per-frame work.
function declutter(labels: VenueLabel[], width: number, height: number): void {
    for (let iter = 0; iter < SEPARATION_ITERATIONS; iter++) {
        for (const a of labels) {
            a.cx += (a.x - a.cx) * ANCHOR_SPRING
            a.cy += ((a.y - LABEL_GAP - a.h / 2) - a.cy) * ANCHOR_SPRING
        }
        for (let i = 0; i < labels.length; i++) {
            for (let j = i + 1; j < labels.length; j++) {
                const a = labels[i]
                const b = labels[j]
                const dx = a.cx - b.cx
                const dy = a.cy - b.cy
                const overlapX = (a.w + b.w) / 2 + SEPARATION_PADDING - Math.abs(dx)
                const overlapY = (a.h + b.h) / 2 + SEPARATION_PADDING - Math.abs(dy)
                if (overlapX <= 0 || overlapY <= 0) continue
                if (overlapX < overlapY) {
                    const push = (overlapX / 2) * (dx === 0 ? (i < j ? 1 : -1) : Math.sign(dx))
                    a.cx += push
                    b.cx -= push
                } else {
                    const push = (overlapY / 2) * (dy === 0 ? -1 : Math.sign(dy))
                    a.cy += push
                    b.cy -= push
                }
            }
        }
    }
    for (const a of labels) {
        a.cx = Math.min(Math.max(a.cx, a.w / 2 + 2), width - a.w / 2 - 2)
        a.cy = Math.min(Math.max(a.cy, a.h / 2 + 2), height - a.h / 2 - 2)
    }
}

export default function GroupVenueMap({matches}: {matches: GroupMatch[]}): React.JSX.Element {
    const {paths, labels, height} = useMemo(() => {
        const stadiums = matches
            .map(m => resolveStadium(m.venue))
            .filter((s): s is Stadium => s !== undefined)
        const view = computeView(stadiums)
        const {project, height} = makeProjection(view)
        const paths = HOST_CODES
            .map(code => getCountryGeometry(code))
            .filter((g): g is Polygon | MultiPolygon => g !== null)
            .map(g => geometryToPath(g, project, view))
        const labels = resolveVenues(matches, project)
        declutter(labels, VIEW_WIDTH, height)
        return {paths, labels, height}
    }, [matches])

    return (
        <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full"
            role="img"
            aria-label="Map of venues hosting this group's fixtures"
        >
            {paths.map((d, i) => (
                <path
                    key={HOST_CODES[i]}
                    d={d}
                    fillRule="evenodd"
                    className="fill-slate-200/50 stroke-slate-300 dark:fill-white/[0.06] dark:stroke-white/15"
                    strokeWidth={1.2}
                    strokeLinejoin="round"
                />
            ))}

            {labels.map(l => (
                <line
                    key={`stem-${l.stadium.city}`}
                    x1={l.x}
                    y1={l.y}
                    x2={l.cx}
                    y2={l.cy + l.h / 2}
                    className="stroke-amber-400/60"
                    strokeWidth={1}
                />
            ))}

            {labels.map(l => (
                <g key={`dot-${l.stadium.city}`}>
                    <circle cx={l.x} cy={l.y} r={DOT_RADIUS * 2.2} className="fill-amber-400/25"/>
                    <circle cx={l.x} cy={l.y} r={DOT_RADIUS} className="fill-amber-400"/>
                </g>
            ))}

            {labels.map(l => {
                const nameCy = l.cy + l.h / 2 - LABEL_HEIGHT / 2
                return (
                    <g key={`label-${l.stadium.city}`}>
                        <rect
                            x={l.cx - l.w / 2}
                            y={nameCy - LABEL_HEIGHT / 2}
                            width={l.w}
                            height={LABEL_HEIGHT}
                            rx={8}
                            className="fill-white/90 stroke-slate-200 dark:fill-black/60 dark:stroke-white/10"
                            strokeWidth={1}
                        />
                        <text x={l.cx} y={nameCy - 3} textAnchor="middle" className="fill-slate-800 dark:fill-gray-100" fontSize={NAME_FONT} fontWeight={600}>
                            {l.stadium.name}
                        </text>
                        <text x={l.cx} y={nameCy + CITY_FONT} textAnchor="middle" className="fill-slate-400 dark:fill-gray-400" fontSize={CITY_FONT} letterSpacing={0.5}>
                            {l.stadium.city.toUpperCase()}
                        </text>
                    </g>
                )
            })}

            {labels.flatMap(l => {
                const nameTop = l.cy + l.h / 2 - LABEL_HEIGHT
                return l.matches.map((m, i) => {
                    const pillCy = nameTop - PILL_GAP - PILL_HEIGHT / 2 - i * (PILL_HEIGHT + PILL_GAP)
                    const kickedOff = m.state === MatchStateEnum.Live || m.state === MatchStateEnum.Completed
                    const pillClassName = "flex h-full w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2 shadow-sm transition-colors hover:bg-white dark:border-white/15 dark:bg-black/70 dark:hover:bg-black/90"
                    const pillContent = (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={flagSrc(m.homeFlagCode, "w40")} alt={m.homeTeam} className="h-4 w-6 rounded-sm object-cover" onError={handleFlagError(m.homeFlagCode, "w40")}/>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500">v</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={flagSrc(m.awayFlagCode, "w40")} alt={m.awayTeam} className="h-4 w-6 rounded-sm object-cover" onError={handleFlagError(m.awayFlagCode, "w40")}/>
                        </>
                    )
                    return (
                        <foreignObject
                            key={`pill-${m.matchId}`}
                            x={l.cx - PILL_WIDTH / 2}
                            y={pillCy - PILL_HEIGHT / 2}
                            width={PILL_WIDTH}
                            height={PILL_HEIGHT}
                        >
                            <div style={{width: "100%", height: "100%"}}>
                                {kickedOff ? (
                                    <Link href={`/app/match/${m.matchId}/predictions`} className={pillClassName} aria-label={`${m.homeTeam} vs ${m.awayTeam}`}>
                                        {pillContent}
                                    </Link>
                                ) : (
                                    <div className={pillClassName} aria-label={`${m.homeTeam} vs ${m.awayTeam}`}>
                                        {pillContent}
                                    </div>
                                )}
                            </div>
                        </foreignObject>
                    )
                })
            })}
        </svg>
    )
}
