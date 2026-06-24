'use client'

import React, {useEffect, useMemo, useState} from "react"
import {Canvas, useThree} from "@react-three/fiber"
import {Html, OrbitControls} from "@react-three/drei"
import * as THREE from "three"
import {COUNTRY_COORDS} from "./country-coords"
import {resolveStadium, Stadium} from "./stadium-coords"
import {GLOBE_RADIUS, latLngToVec3, buildContinentGeometry, buildCountryFillGeometry, hasCountryFill} from "./globe-utils"

// One fixture in a group, reduced to what the globe needs to plot it.
export type GroupMatch = {
    homeTeam: string
    homeFlagCode: string
    awayTeam: string
    awayFlagCode: string
    venue: string
}

// Extruded country highlight: a base just off the globe up to a raised top, so
// the nations taking part in the group light up and stand proud of the surface.
const COUNTRY_FILL_BASE = GLOBE_RADIUS + 0.005
const COUNTRY_FILL_HEIGHT = 0.05
const COUNTRY_FILL_TOP = COUNTRY_FILL_BASE + COUNTRY_FILL_HEIGHT
const STADIUM_BASE_OFFSET = 0.01
// Maps a World Cup host nation to the team code we extrude it under, so a venue
// rests on the raised land when its host country is one of the group's teams.
const HOST_NATION_CODE: Record<string, string> = {usa: "us", can: "ca", mex: "mx"}

const CAMERA_FOV = 42
const CAMERA_FIT_MARGIN = 1.3
const CAMERA_MIN_DISTANCE = 2.6
// The pills float above the markers; frame to keep that whole region in shot.
const FOCUS_OUTER_RADIUS = GLOBE_RADIUS + 0.4

// A unique venue plus every group fixture being played there.
type VenuePlot = {
    stadium: Stadium
    position: THREE.Vector3
    matchups: {homeFlagCode: string; awayFlagCode: string; homeTeam: string; awayTeam: string}[]
}

// Where a venue's marker sits: on the raised country top when its host nation is
// one of the playing teams (and thus extruded), otherwise just off the surface.
function venueRadius(stadium: Stadium, countryCodes: string[]): number {
    const hostCode = HOST_NATION_CODE[stadium.country]
    return countryCodes.includes(hostCode) ? COUNTRY_FILL_TOP : GLOBE_RADIUS + STADIUM_BASE_OFFSET
}

// Collapses the group's fixtures down to the distinct venues hosting them, each
// carrying the matchups played there. Fixtures whose venue we can't place are
// dropped from the globe (they still appear in the table).
function resolveVenues(matches: GroupMatch[], countryCodes: string[]): VenuePlot[] {
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
            position: dir.multiplyScalar(venueRadius(stadium, countryCodes)),
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

// Fills a playing country's landmass with a highlight extruded slightly off the
// globe, so each nation in the group lights up on the surface.
function CountryFill({code, color}: {code: string; color: string}) {
    const geometry = useMemo(
        () => buildCountryFillGeometry(code, COUNTRY_FILL_BASE, COUNTRY_FILL_HEIGHT),
        [code],
    )
    if (!geometry) return null
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.25}
                roughness={0.5}
                metalness={0.1}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

const PILL_LIFT = 0.16

// A small flag pill — "home v away" — sitting just above a venue marker. When a
// venue hosts more than one group fixture they stack.
function VenuePill({matchups}: {matchups: VenuePlot["matchups"]}) {
    return (
        <div className="pointer-events-none flex flex-col items-center gap-1" style={{transform: "translate(-50%, -100%)"}}>
            {matchups.map((m, i) => (
                <span
                    key={`${m.homeFlagCode}-${m.awayFlagCode}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white/85 border border-slate-200 dark:bg-black/55 dark:border-white/10 px-1.5 py-0.5 shadow-sm backdrop-blur whitespace-nowrap"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w40/${m.homeFlagCode}.png`} alt={m.homeTeam} className="h-3.5 w-3.5 rounded-full object-cover ring-1 ring-slate-900/15 dark:ring-white/20"/>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-gray-500">v</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w40/${m.awayFlagCode}.png`} alt={m.awayTeam} className="h-3.5 w-3.5 rounded-full object-cover ring-1 ring-slate-900/15 dark:ring-white/20"/>
                </span>
            ))}
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
            <Html distanceFactor={3.4} position={[0, 0.11 + PILL_LIFT, 0]} occlude style={{pointerEvents: "none"}} zIndexRange={[20, 0]}>
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
    const {countryCodes, venues, cameraPos} = useMemo(() => {
        const codes = uniqueCountryCodes(matches)
        const plots = resolveVenues(matches, codes)
        const focusDirs = plots.length > 0
            ? plots.map(p => p.position.clone())
            : codes.map(c => COUNTRY_COORDS[c]).filter(Boolean).map(c => latLngToVec3(c[0], c[1], 1))
        return {countryCodes: codes, venues: plots, cameraPos: framingPosition(focusDirs)}
    }, [matches])

    const fillCodes = useMemo(() => countryCodes.filter(hasCountryFill), [countryCodes])

    return (
        <>
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
            {fillCodes.map(code => <CountryFill key={code} code={code} color="#67e8f9"/>)}
            {venues.map(plot => <VenueMarker key={plot.stadium.city} plot={plot}/>)}
            {enableControls && (
                <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} enableDamping dampingFactor={0.08}/>
            )}
        </>
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
