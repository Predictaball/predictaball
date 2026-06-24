'use client'

import React, {useContext, useEffect, useMemo, useRef, useState} from "react"
import {Canvas, useFrame, useThree} from "@react-three/fiber"
import {Html, OrbitControls} from "@react-three/drei"
import * as THREE from "three"
import {COUNTRY_COORDS} from "./country-coords"
import {resolveStadium, Stadium} from "./stadium-coords"
import {GLOBE_RADIUS, latLngToVec3, buildContinentGeometry} from "./globe-utils"

// One fixture in a group, reduced to what the globe needs to plot it.
export type GroupMatch = {
    homeTeam: string
    homeFlagCode: string
    awayTeam: string
    awayFlagCode: string
    venue: string
}

// Venue markers rest just off the globe surface.
const STADIUM_BASE_OFFSET = 0.01

const CAMERA_FOV = 42
// Tight framing: zoom right in on the venues so they fill the frame, leaving
// only a little breathing room around the cluster.
const CAMERA_FIT_MARGIN = 1.06
const CAMERA_MIN_DISTANCE = 2.15
// The pills float just above the markers; frame to keep them in shot.
const FOCUS_OUTER_RADIUS = GLOBE_RADIUS + 0.2

// A unique venue plus every group fixture being played there.
type VenuePlot = {
    stadium: Stadium
    position: THREE.Vector3
    matchups: {homeFlagCode: string; awayFlagCode: string; homeTeam: string; awayTeam: string}[]
}

// Collapses the group's fixtures down to the distinct venues hosting them, each
// carrying the matchups played there. Fixtures whose venue we can't place are
// dropped from the globe (they still appear in the table).
function resolveVenues(matches: GroupMatch[]): VenuePlot[] {
    const byCity = new Map<string, VenuePlot>()
    for (const m of matches) {
        const stadium = resolveStadium(m.venue)
        if (!stadium) continue
        const matchup = {
            homeFlagCode: m.homeFlagCode.toLowerCase(),
            awayFlagCode: m.awayFlagCode.toLowerCase(),
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
        }
        const existing = byCity.get(stadium.city)
        if (existing) {
            existing.matchups.push(matchup)
            continue
        }
        const dir = latLngToVec3(stadium.lat, stadium.lng, 1)
        byCity.set(stadium.city, {
            stadium,
            position: dir.multiplyScalar(GLOBE_RADIUS + STADIUM_BASE_OFFSET),
            matchups: [matchup],
        })
    }
    return [...byCity.values()]
}

function uniqueCountryCodes(matches: GroupMatch[]): string[] {
    const set = new Set<string>()
    for (const m of matches) {
        set.add(m.homeFlagCode.toLowerCase())
        set.add(m.awayFlagCode.toLowerCase())
    }
    return [...set]
}

// Positions the camera so every focus point (the venues, or the playing nations
// when no venue resolved) is comfortably inside the frame.
function framingPosition(dirs: THREE.Vector3[]): [number, number, number] {
    if (dirs.length === 0) return [0, 0, 5]
    const mid = dirs.reduce((acc, d) => acc.add(d.clone().normalize()), new THREE.Vector3())
    if (mid.lengthSq() < 1e-6) {
        const axis = new THREE.Vector3().crossVectors(dirs[0], new THREE.Vector3(0, 1, 0)).normalize()
        mid.copy(dirs[0]).applyAxisAngle(axis, Math.PI / 2)
    }
    mid.normalize()
    const half = dirs.reduce((m, d) => Math.max(m, d.clone().normalize().angleTo(mid)), 0)
    const fovHalfTan = Math.tan((CAMERA_FOV / 2) * Math.PI / 180)
    const fit = FOCUS_OUTER_RADIUS * (Math.cos(half) + Math.sin(half) / fovHalfTan) * CAMERA_FIT_MARGIN
    const distance = Math.max(CAMERA_MIN_DISTANCE, fit)
    return mid.multiplyScalar(distance).toArray()
}

function Continents() {
    const geometry = useMemo(() => buildContinentGeometry(GLOBE_RADIUS + 0.008), [])
    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={0.45}/>
        </lineSegments>
    )
}

const PILL_LIFT = 0.16

// GB home nations have dedicated tag-sequence emoji rather than a regional
// indicator pair, so they're mapped explicitly.
const SUBDIVISION_FLAG_EMOJI: Record<string, string> = {
    "gb-eng": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    "gb-sct": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    "gb-wls": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
}

// Turns a flag code into its emoji flag. Two-letter ISO codes become a pair of
// regional indicator symbols; GB home nations use their tag sequences. Returns
// an empty string for codes we can't map (the pill then just shows the "v").
function flagEmoji(code: string): string {
    const c = code.toLowerCase()
    if (SUBDIVISION_FLAG_EMOJI[c]) return SUBDIVISION_FLAG_EMOJI[c]
    const cc = c.slice(0, 2)
    if (!/^[a-z]{2}$/.test(cc)) return ""
    return String.fromCodePoint(...[...cc].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 97))
}

// Per-pill pixel nudge applied on top of its 3D anchor to keep neighbouring
// pills from overlapping. Mutated in place each frame by the declutter manager.
type PillOffset = {ox: number; oy: number}

// Shared registry of every on-screen pill element and its current nudge, so a
// single manager can resolve overlaps across all of them.
const PillDeclutterContext = React.createContext<React.MutableRefObject<Map<HTMLElement, PillOffset>> | null>(null)

// Gap (px) to leave between pills once separated.
const SEPARATION_PADDING = 4
// How strongly a nudged pill is pulled back toward its true anchor each frame,
// so pills settle back over their venue as soon as there's room.
const OFFSET_DECAY = 0.85
const SEPARATION_ITERATIONS = 8

// Runs every frame: measures each pill's on-screen box, relaxes its nudge back
// toward its anchor, then iteratively pushes overlapping pairs apart along their
// shallowest axis. The pills are anchored in 3D (and the camera can rotate), so
// this has to work in live screen space rather than a precomputed layout.
function PillDeclutterManager(): null {
    const store = useContext(PillDeclutterContext)
    useFrame(() => {
        if (!store) return
        const map = store.current

        type Entry = {off: PillOffset; el: HTMLElement; w: number; h: number; ax: number; ay: number}
        const entries: Entry[] = []
        map.forEach((off, el) => {
            const r = el.getBoundingClientRect()
            if (r.width === 0 && r.height === 0) return
            // Anchor centre = current on-screen centre minus the nudge already applied.
            entries.push({off, el, w: r.width, h: r.height, ax: r.left + r.width / 2 - off.ox, ay: r.top + r.height / 2 - off.oy})
        })

        for (const e of entries) {
            e.off.ox *= OFFSET_DECAY
            e.off.oy *= OFFSET_DECAY
        }

        for (let iter = 0; iter < SEPARATION_ITERATIONS; iter++) {
            for (let i = 0; i < entries.length; i++) {
                for (let j = i + 1; j < entries.length; j++) {
                    const a = entries[i]
                    const b = entries[j]
                    const dx = (a.ax + a.off.ox) - (b.ax + b.off.ox)
                    const dy = (a.ay + a.off.oy) - (b.ay + b.off.oy)
                    const overlapX = (a.w + b.w) / 2 + SEPARATION_PADDING - Math.abs(dx)
                    const overlapY = (a.h + b.h) / 2 + SEPARATION_PADDING - Math.abs(dy)
                    if (overlapX <= 0 || overlapY <= 0) continue
                    // Resolve along whichever axis they overlap least — the smaller move.
                    if (overlapX < overlapY) {
                        const push = (overlapX / 2) * (dx === 0 ? (i < j ? 1 : -1) : Math.sign(dx))
                        a.off.ox += push
                        b.off.ox -= push
                    } else {
                        const push = (overlapY / 2) * (dy === 0 ? -1 : Math.sign(dy))
                        a.off.oy += push
                        b.off.oy -= push
                    }
                }
            }
        }

        for (const e of entries) {
            e.el.style.transform = `translate(${Math.round(e.off.ox)}px, ${Math.round(e.off.oy)}px)`
        }
    })
    return null
}

// A small flag pill — "home v away" — sitting just above a venue marker. While
// we refine the look we render the flags as emoji: crisp at any zoom (no
// pixelation) and compact. When a venue hosts more than one group fixture the
// pills stack. The inner element registers with the declutter manager, which
// nudges it in screen space to avoid overlapping neighbouring venues' pills.
function VenuePill({matchups}: {matchups: VenuePlot["matchups"]}) {
    const store = useContext(PillDeclutterContext)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const el = ref.current
        if (!store || !el) return
        store.current.set(el, {ox: 0, oy: 0})
        return () => { store.current.delete(el) }
    }, [store])

    return (
        <div className="pointer-events-none" style={{transform: "translate(-50%, -100%)"}}>
            <div ref={ref} className="flex flex-col items-center gap-0.5" style={{willChange: "transform"}}>
                {matchups.map((m, i) => (
                    <span
                        key={`${m.homeFlagCode}-${m.awayFlagCode}-${i}`}
                        className="inline-flex items-center gap-0.5 rounded-full bg-white/85 border border-slate-200 dark:bg-black/55 dark:border-white/10 px-1 py-px shadow-sm backdrop-blur whitespace-nowrap leading-none"
                    >
                        <span className="text-[8px]" role="img" aria-label={m.homeTeam}>{flagEmoji(m.homeFlagCode)}</span>
                        <span className="text-[6px] font-bold uppercase text-slate-400 dark:text-gray-500">v</span>
                        <span className="text-[8px]" role="img" aria-label={m.awayTeam}>{flagEmoji(m.awayFlagCode)}</span>
                    </span>
                ))}
            </div>
        </div>
    )
}

// A venue pin: a glowing post rising off the surface, capped by a beacon, with a
// ground ring marking the spot, and the matchup pill floating above it.
function VenueMarker({plot}: {plot: VenuePlot}) {
    const quaternion = useMemo(() => {
        const normal = plot.position.clone().normalize()
        return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
    }, [plot.position])

    return (
        <group position={plot.position} quaternion={quaternion}>
            {/* Ground ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
                <ringGeometry args={[0.028, 0.04, 32]}/>
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.75} side={THREE.DoubleSide}/>
            </mesh>
            {/* Post */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.1, 10]}/>
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} roughness={0.4}/>
            </mesh>
            {/* Beacon */}
            <mesh position={[0, 0.11, 0]}>
                <sphereGeometry args={[0.022, 16, 16]}/>
                <meshStandardMaterial color="#fff7cc" emissive="#fbbf24" emissiveIntensity={1.4} toneMapped={false}/>
            </mesh>
            <Html distanceFactor={1.8} position={[0, 0.11 + PILL_LIFT, 0]} occlude style={{pointerEvents: "none"}} zIndexRange={[20, 0]}>
                <VenuePill matchups={plot.matchups}/>
            </Html>
        </group>
    )
}

function CameraRig({position}: {position: [number, number, number]}) {
    const {camera} = useThree()
    useEffect(() => {
        camera.position.set(position[0], position[1], position[2])
        camera.lookAt(0, 0, 0)
    }, [camera, position])
    return null
}

function Scene({matches, enableControls}: {matches: GroupMatch[]; enableControls: boolean}) {
    const pillStore = useRef<Map<HTMLElement, PillOffset>>(new Map())
    const {venues, cameraPos} = useMemo(() => {
        const plots = resolveVenues(matches)
        const focusDirs = plots.length > 0
            ? plots.map(p => p.position.clone())
            : uniqueCountryCodes(matches).map(c => COUNTRY_COORDS[c]).filter(Boolean).map(c => latLngToVec3(c[0], c[1], 1))
        return {venues: plots, cameraPos: framingPosition(focusDirs)}
    }, [matches])

    return (
        <PillDeclutterContext.Provider value={pillStore}>
            <CameraRig position={cameraPos}/>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS, 64, 64]}/>
                <meshStandardMaterial color="#1e3a5f" roughness={0.75} metalness={0.15}/>
            </mesh>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS + 0.003, 48, 48]}/>
                <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.08}/>
            </mesh>
            <Continents/>
            {venues.map(plot => <VenueMarker key={plot.stadium.city} plot={plot}/>)}
            <PillDeclutterManager/>
            {enableControls && (
                <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} enableDamping dampingFactor={0.08}/>
            )}
        </PillDeclutterContext.Provider>
    )
}

function useCoarsePointer(): boolean {
    const [coarse, setCoarse] = useState(true)
    useEffect(() => {
        const mq = window.matchMedia("(pointer: coarse)")
        const update = () => setCoarse(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    return coarse
}

export default function GroupVenueGlobe({matches}: {matches: GroupMatch[]}): React.JSX.Element {
    const coarsePointer = useCoarsePointer()
    const interactive = !coarsePointer

    return (
        <div className={`relative h-full w-full ${interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}>
            <Canvas camera={{position: [0, 0, 5], fov: CAMERA_FOV}} gl={{antialias: true, alpha: true}} dpr={[1, 1.5]}>
                <ambientLight intensity={0.75}/>
                <directionalLight position={[5, 3, 5]} intensity={1.1}/>
                <pointLight position={[-5, -3, -5]} intensity={0.4} color="#22d3ee"/>
                <Scene matches={matches} enableControls={interactive}/>
            </Canvas>
        </div>
    )
}
