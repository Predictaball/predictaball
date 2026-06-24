'use client'

import React, {useMemo} from "react"
import type {MultiPolygon, Polygon, Position} from "geojson"
import {resolveStadium, Stadium} from "./stadium-coords"
import {getCountryGeometry} from "./globe-utils"

// One fixture in a group, reduced to what the map needs to plot it.
export type GroupMatch = {
    homeTeam: string
    homeFlagCode: string
    awayTeam: string
    awayFlagCode: string
    venue: string
}

// The three World Cup 2026 host nations whose outlines we draw.
const HOST_CODES = ["us", "ca", "mx"]

// Fixed geographic window framing the hosts' populated regions. Canada's arctic
// archipelago (and Alaska/Hawaii) fall outside this and are cropped by the SVG
// viewport, keeping the map focused on where the venues actually are.
const VIEW = {lngMin: -127, lngMax: -65, latMin: 13.5, latMax: 54}

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

// Standard Mercator, lng/lat in degrees -> planar units (x east, y north).
function mercator(lng: number, lat: number): [number, number] {
    return [lng * Math.PI / 180, Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2))]
}

// Projects the fixed VIEW window into the padded viewBox at a single (true
// Mercator) scale, so country shapes aren't distorted. Anything outside VIEW
// projects outside the viewBox and is clipped.
function makeProjection() {
    const [xMin] = mercator(VIEW.lngMin, 0)
    const [xMax] = mercator(VIEW.lngMax, 0)
    const yTop = mercator(0, VIEW.latMax)[1]
    const yBot = mercator(0, VIEW.latMin)[1]
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
// window (e.g. Hawaii, far-north arctic islands) or wraps the antimeridian (the
// Aleutians), which would otherwise streak a line across the map.
function ringVisible(ring: Position[]): boolean {
    let lngMin = Infinity, lngMax = -Infinity, latMin = Infinity, latMax = -Infinity
    for (const [lng, lat] of ring) {
        if (lng < lngMin) lngMin = lng
        if (lng > lngMax) lngMax = lng
        if (lat < latMin) latMin = lat
        if (lat > latMax) latMax = lat
    }
    if (lngMax - lngMin > 180) return false
    const M = 6
    if (lngMax < VIEW.lngMin - M || lngMin > VIEW.lngMax + M) return false
    if (latMax < VIEW.latMin - M || latMin > VIEW.latMax + M) return false
    return true
}

function geometryToPath(geom: Polygon | MultiPolygon, project: (lng: number, lat: number) => [number, number]): string {
    const polygons = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates
    return polygons
        .map(poly => poly.filter(ringVisible).map(ring => ringToPath(ring, project)).join(""))
        .join("")
}

type VenueLabel = {stadium: Stadium; x: number; y: number; w: number; h: number; cx: number; cy: number}

// Collapses the group's fixtures to distinct venues we can place, projecting each
// to viewBox coordinates. Fixtures whose venue we can't resolve are dropped (they
// still appear in the table).
function resolveVenues(matches: GroupMatch[], project: (lng: number, lat: number) => [number, number]): VenueLabel[] {
    const byCity = new Map<string, VenueLabel>()
    for (const m of matches) {
        const stadium = resolveStadium(m.venue)
        if (!stadium || byCity.has(stadium.city)) continue
        const [x, y] = project(stadium.lng, stadium.lat)
        const w = Math.max(stadium.name.length * (NAME_FONT * 0.56), stadium.city.length * (CITY_FONT * 0.6)) + 2 * LABEL_PAD_X
        byCity.set(stadium.city, {stadium, x, y, w, h: LABEL_HEIGHT, cx: x, cy: y - LABEL_GAP - LABEL_HEIGHT / 2})
    }
    return [...byCity.values()]
}

// Nudges the labels apart so they don't overlap, while a light spring keeps each
// one tugged back above its own dot. Pure 2D layout — no zoom, no per-frame work.
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
        const {project, height} = makeProjection()
        const paths = HOST_CODES
            .map(code => getCountryGeometry(code))
            .filter((g): g is Polygon | MultiPolygon => g !== null)
            .map(g => geometryToPath(g, project))
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
            aria-label="Map of venues across the host nations"
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

            {labels.map(l => (
                <g key={`label-${l.stadium.city}`}>
                    <rect
                        x={l.cx - l.w / 2}
                        y={l.cy - l.h / 2}
                        width={l.w}
                        height={l.h}
                        rx={8}
                        className="fill-white/90 stroke-slate-200 dark:fill-black/60 dark:stroke-white/10"
                        strokeWidth={1}
                    />
                    <text x={l.cx} y={l.cy - 3} textAnchor="middle" className="fill-slate-800 dark:fill-gray-100" fontSize={NAME_FONT} fontWeight={600}>
                        {l.stadium.name}
                    </text>
                    <text x={l.cx} y={l.cy + CITY_FONT} textAnchor="middle" className="fill-slate-400 dark:fill-gray-400" fontSize={CITY_FONT} letterSpacing={0.5}>
                        {l.stadium.city.toUpperCase()}
                    </text>
                </g>
            ))}
        </svg>
    )
}
