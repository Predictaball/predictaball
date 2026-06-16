'use client'

import React, {useEffect, useMemo, useRef, useState} from "react"
import {Canvas, useFrame, useThree} from "@react-three/fiber"
import {Html, Line, OrbitControls, useTexture} from "@react-three/drei"
import * as THREE from "three"
import {COUNTRY_COORDS} from "./country-coords"
import {resolveStadium, Stadium} from "./stadium-coords"
import {GLOBE_RADIUS, latLngToVec3, buildContinentGeometry, buildCountryFillGeometry, hasCountryFill, cropSquare} from "./globe-utils"

const FLAG_DISC_RADIUS = 0.09
const FLAG_BORDER_WIDTH = 0.012
const FLAG_ANCHOR_OFFSET = 0.005
const FLAG_LIFT = 0.42
const FLAG_CAMERA_TILT = 0.45
const CAMERA_FOV = 42
const CAMERA_FIT_MARGIN = 1.12
const CAMERA_MIN_DISTANCE = 2.8
const FLAG_OUTER_RADIUS = GLOBE_RADIUS + FLAG_LIFT + FLAG_DISC_RADIUS + FLAG_BORDER_WIDTH
// Extruded country highlight: a base just off the globe up to a raised top.
const COUNTRY_FILL_BASE = GLOBE_RADIUS + 0.005
const COUNTRY_FILL_HEIGHT = 0.05
const COUNTRY_FILL_TOP = COUNTRY_FILL_BASE + COUNTRY_FILL_HEIGHT
const STADIUM_BASE_OFFSET = 0.01
// Where surface-bound features (arc endpoints, flag anchors, the stadium) sit on
// a bare globe; on an extruded country they rest on the raised top instead.
const GROUND_OFFSET = 0.012
// Maps a World Cup host nation to the team code we extrude it under.
const HOST_NATION_CODE: Record<string, string> = {usa: "us", can: "ca", mex: "mx"}

// Radius at which a country's own surface features (its flag pin, the arc
// springing from it) sit: the raised land top when it is extruded.
function countryGroundRadius(code: string): number {
    return hasCountryFill(code) ? COUNTRY_FILL_TOP : GLOBE_RADIUS + GROUND_OFFSET
}

const TRAVEL_SECONDS = 0.7
const ARC_DRAW_SECONDS = 0.9
const TOUR_TRAVERSE_SECONDS = 3.0
const TOUR_DWELL_SECONDS = 0.7
const TOUR_LEG_SECONDS = TOUR_TRAVERSE_SECONDS + TOUR_DWELL_SECONDS
const TOUR_INTRO_SECONDS = 1.1
const POST_DRAW_HOLD_SECONDS = 0.9

type Phase = "travel" | "draw" | "hold" | "tourIntro" | "tour" | "done"

interface AnimState {
    phase: Phase
    progress: number
    tourLeg: number
    tourFrom: THREE.Vector3
}

function visibleArc(
    aDir: THREE.Vector3, bDir: THREE.Vector3,
    aRadius = GLOBE_RADIUS + 0.012, bRadius = GLOBE_RADIUS + 0.012, steps = 64,
): THREE.Vector3[] {
    const aN = aDir.clone().normalize()
    const bN = bDir.clone().normalize()

    const mid = aN.clone().add(bN)
    if (mid.lengthSq() < 1e-4) {
        const fallback = new THREE.Vector3().crossVectors(aN, new THREE.Vector3(0, 1, 0))
        if (fallback.lengthSq() < 1e-4) fallback.set(1, 0, 0)
        mid.copy(fallback)
    }
    mid.normalize()

    const angle = aN.angleTo(bN)
    // Bulge clears the raised country tops so the arc never dives into an
    // extruded landmass, even on a short host-country-to-its-own-venue hop.
    const bulge = Math.max(aRadius, bRadius) - GLOBE_RADIUS + 0.2 + angle * 0.55
    const control = mid.clone().multiplyScalar(GLOBE_RADIUS + bulge)
    const aPos = aN.clone().multiplyScalar(aRadius)
    const bPos = bN.clone().multiplyScalar(bRadius)

    const points: THREE.Vector3[] = []
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const one = 1 - t
        const p = new THREE.Vector3()
            .addScaledVector(aPos, one * one)
            .addScaledVector(control, 2 * one * t)
            .addScaledVector(bPos, t * t)
        points.push(p)
    }
    return points
}

function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function slerpVec(from: THREE.Vector3, to: THREE.Vector3, mag: number, t: number): THREE.Vector3 {
    const fromDir = from.clone().normalize()
    const toDir = to.clone().normalize()
    const axis = new THREE.Vector3().crossVectors(fromDir, toDir)
    const angle = fromDir.angleTo(toDir)
    if (axis.lengthSq() < 1e-8 || angle < 1e-4) return fromDir.multiplyScalar(mag)
    axis.normalize()
    return fromDir.clone().applyAxisAngle(axis, angle * t).multiplyScalar(mag)
}

function cameraPath(homeCode: string, awayCode: string, stadium?: Stadium): {startPos: THREE.Vector3; endPos: THREE.Vector3} {
    const hc = COUNTRY_COORDS[homeCode]
    const ac = COUNTRY_COORDS[awayCode]
    const fallback = new THREE.Vector3(0, 0, 5)
    if (!hc || !ac) return {startPos: fallback, endPos: fallback}

    const aDir = latLngToVec3(hc[0], hc[1], 1)
    const bDir = latLngToVec3(ac[0], ac[1], 1)
    const dirs = [aDir, bDir]
    if (stadium) dirs.push(latLngToVec3(stadium.lat, stadium.lng, 1))

    const mid = dirs.reduce((acc, d) => acc.add(d), new THREE.Vector3())
    if (mid.lengthSq() < 1e-6) {
        const axis = new THREE.Vector3().crossVectors(aDir, new THREE.Vector3(0, 1, 0)).normalize()
        mid.copy(aDir).applyAxisAngle(axis, Math.PI / 2)
    }
    mid.normalize()

    const maxHalf = dirs.reduce((m, d) => Math.max(m, d.angleTo(mid)), 0)
    const half = maxHalf
    const fovHalfTan = Math.tan((CAMERA_FOV / 2) * Math.PI / 180)
    const fitDistance = FLAG_OUTER_RADIUS * (Math.cos(half) + Math.sin(half) / fovHalfTan) * CAMERA_FIT_MARGIN
    const distance = Math.max(CAMERA_MIN_DISTANCE, fitDistance)
    return {
        startPos: aDir.clone().normalize().multiplyScalar(distance),
        endPos: mid.clone().multiplyScalar(distance),
    }
}

function AnimatedArc({points, anim}: {points: THREE.Vector3[]; anim: React.RefObject<AnimState>}) {
    const [, setTick] = useState(0)

    useFrame(() => {
        const phase = anim.current.phase
        if (phase === "travel" || phase === "draw") setTick(t => t + 1)
    })

    const visiblePoints = useMemo(() => {
        const {phase, progress} = anim.current
        if (phase === "travel") return [points[0], points[0]]
        if (phase !== "draw") return points
        const p = progress
        if (p >= 1) return points
        const segments = points.length - 1
        const t = p * segments
        const lastIndex = Math.floor(t)
        const frac = t - lastIndex
        const result = points.slice(0, lastIndex + 1)
        const head = points[Math.min(lastIndex, segments)]
            .clone()
            .lerp(points[Math.min(lastIndex + 1, segments)], frac)
        result.push(head)
        if (result.length < 2) result.push(points[0])
        return result
    }, [points, anim.current.phase, anim.current.progress]) // eslint-disable-line react-hooks/exhaustive-deps

    return <Line points={visiblePoints} color="#fbbf24" lineWidth={2.2} transparent opacity={0.95}/>
}

function CameraRig({homeCode, awayCode, stadium, anim, tourLegs, controlsRef, userStopped, onIntroComplete}: {homeCode: string; awayCode: string; stadium?: Stadium; anim: React.RefObject<AnimState>; tourLegs: THREE.Vector3[][]; controlsRef: React.RefObject<{setAzimuthalAngle: (v: number) => void; setPolarAngle: (v: number) => void; update: () => void} | null>; userStopped: boolean; onIntroComplete: () => void}) {
    const {camera} = useThree()
    const {startPos, endPos} = useMemo(() => cameraPath(homeCode, awayCode, stadium), [homeCode, awayCode, stadium])
    const travelOrigin = useRef(new THREE.Vector3(0, 0, 5))
    const tourDistance = useRef(endPos.length())
    const initialized = useRef(false)

    useEffect(() => {
        tourDistance.current = endPos.length()
        if (!initialized.current) {
            camera.position.copy(startPos)
            camera.lookAt(0, 0, 0)
            initialized.current = true
            anim.current.phase = "draw"
            anim.current.progress = 0
            travelOrigin.current.copy(startPos)
            return
        }
        travelOrigin.current.copy(camera.position)
        anim.current.phase = "travel"
        anim.current.progress = 0
    }, [camera, startPos, endPos, anim])

    useFrame((_, delta) => {
        const a = anim.current
        if (a.phase === "done") return
        if (userStopped) {
            a.phase = "done"
            return
        }

        if (a.phase === "travel" || a.phase === "draw") {
            const duration = a.phase === "travel" ? TRAVEL_SECONDS : ARC_DRAW_SECONDS
            a.progress = Math.min(1, a.progress + delta / duration)
            const eased = easeInOut(a.progress)

            if (a.phase === "travel") {
                const mag = travelOrigin.current.length() + (startPos.length() - travelOrigin.current.length()) * eased
                camera.position.copy(slerpVec(travelOrigin.current, startPos, mag, eased))
            } else {
                const mag = startPos.length() + (endPos.length() - startPos.length()) * eased
                camera.position.copy(slerpVec(startPos, endPos, mag, eased))
            }
            camera.lookAt(0, 0, 0)

            if (a.progress >= 1) {
                if (a.phase === "travel") {
                    a.phase = "draw"
                    a.progress = 0
                } else {
                    a.phase = "hold"
                    a.progress = 0
                }
            }
            return
        }

        if (a.phase === "hold") {
            a.progress = Math.min(1, a.progress + delta / POST_DRAW_HOLD_SECONDS)
            if (a.progress >= 1) {
                if (tourLegs.length >= 1 && tourLegs[0].length >= 2) {
                    a.phase = "tourIntro"
                    a.progress = 0
                    a.tourLeg = 0
                    a.tourFrom = camera.position.clone().normalize()
                    onIntroComplete()
                } else {
                    a.phase = "done"
                    onIntroComplete()
                }
            }
            return
        }

        if (a.phase === "tourIntro") {
            a.progress = Math.min(1, a.progress + delta / TOUR_INTRO_SECONDS)
            const eased = easeInOut(a.progress)
            const toDir = tourLegs[0][0].clone().normalize()
            const dir = slerpVec(a.tourFrom, toDir, 1, eased).normalize()
            const targetPos = dir.multiplyScalar(tourDistance.current)
            camera.position.copy(targetPos)
            camera.lookAt(0, 0, 0)
            if (a.progress >= 1) {
                a.phase = "tour"
                a.progress = 0
                a.tourLeg = 0
            }
            return
        }

        if (a.phase === "tour") {
            a.progress += delta / TOUR_LEG_SECONDS
            while (a.progress >= 1) {
                a.progress -= 1
                a.tourLeg = (a.tourLeg + 1) % tourLegs.length
            }
            const traverseFrac = Math.min(1, a.progress / (TOUR_TRAVERSE_SECONDS / TOUR_LEG_SECONDS))
            const eased = easeInOut(traverseFrac)
            const leg = tourLegs[a.tourLeg]
            const segs = leg.length - 1
            const u = eased * segs
            const idx = Math.min(Math.floor(u), segs - 1)
            const frac = u - idx
            const p = leg[idx].clone().lerp(leg[idx + 1], frac)
            const dir = p.clone().normalize()
            const targetPos = dir.multiplyScalar(tourDistance.current)

            if (controlsRef.current) {
                const sph = new THREE.Spherical().setFromVector3(targetPos)
                controlsRef.current.setAzimuthalAngle(sph.theta)
                controlsRef.current.setPolarAngle(sph.phi)
                controlsRef.current.update()
            } else {
                camera.position.copy(targetPos)
                camera.lookAt(0, 0, 0)
            }
        }
    })

    return null
}

function Continents() {
    const geometry = useMemo(() => buildContinentGeometry(GLOBE_RADIUS + 0.008), [])
    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={0.45}/>
        </lineSegments>
    )
}

const COUNTRY_FILL_OPACITY = 0.85
const COUNTRY_FILL_FADE_SECONDS = 0.9

// Fills the landmass of a playing country with a highlight that is extruded
// slightly off the globe and fades in, so both competing nations rise up and
// light up on the globe.
function CountryFill({code, color}: {code: string; color: string}) {
    const geometry = useMemo(
        () => buildCountryFillGeometry(code, COUNTRY_FILL_BASE, COUNTRY_FILL_HEIGHT),
        [code],
    )
    const materialRef = useRef<THREE.MeshStandardMaterial>(null)
    const elapsed = useRef(0)

    useEffect(() => {
        elapsed.current = 0
    }, [code])

    useFrame((_, delta) => {
        if (!materialRef.current) return
        if (elapsed.current >= COUNTRY_FILL_FADE_SECONDS) return
        elapsed.current = Math.min(COUNTRY_FILL_FADE_SECONDS, elapsed.current + delta)
        const t = easeInOut(elapsed.current / COUNTRY_FILL_FADE_SECONDS)
        materialRef.current.opacity = t * COUNTRY_FILL_OPACITY
    })

    if (!geometry) return null
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial
                ref={materialRef}
                color={color}
                emissive={color}
                emissiveIntensity={0.25}
                roughness={0.5}
                metalness={0.1}
                transparent
                opacity={0}
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

function mirrorHorizontally(source: THREE.Texture): THREE.Texture {
    const tex = source.clone()
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.offset.set(source.offset.x + source.repeat.x, source.offset.y)
    tex.repeat.set(-source.repeat.x, source.repeat.y)
    tex.needsUpdate = true
    return tex
}

function FocusFlag({code, position, anchorRadius}: {code: string; position: THREE.Vector3; anchorRadius: number}) {
    const texture = useTexture(`https://flagcdn.com/w320/${code}.png`) as THREE.Texture
    const front = useMemo(() => cropSquare(texture), [texture])
    const back = useMemo(() => mirrorHorizontally(front), [front])
    const {anchorPos, flagPos, surfaceNormal} = useMemo(() => {
        const dir = position.clone().normalize()
        return {
            anchorPos: dir.clone().multiplyScalar(anchorRadius),
            flagPos: dir.clone().multiplyScalar(GLOBE_RADIUS + FLAG_LIFT),
            surfaceNormal: dir.clone(),
        }
    }, [position, anchorRadius])

    const groupRef = useRef<THREE.Group>(null)
    const {camera} = useThree()

    useFrame(() => {
        if (!groupRef.current) return
        const camDir = camera.position.clone().sub(flagPos).normalize()
        const faceDir = surfaceNormal.clone().lerp(camDir, FLAG_CAMERA_TILT).normalize()
        groupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), faceDir)
    })

    return (
        <>
            <mesh position={anchorPos}>
                <sphereGeometry args={[0.012, 10, 10]}/>
                <meshBasicMaterial color="#22d3ee"/>
            </mesh>
            <Line points={[anchorPos, flagPos]} color="#22d3ee" lineWidth={0.8} transparent opacity={0.45}/>
            <group ref={groupRef} position={flagPos}>
                <mesh>
                    <circleGeometry args={[FLAG_DISC_RADIUS + FLAG_BORDER_WIDTH, 48]}/>
                    <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide}/>
                </mesh>
                <mesh position={[0, 0, 0.001]}>
                    <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                    <meshBasicMaterial map={front} toneMapped={false} side={THREE.FrontSide}/>
                </mesh>
                <mesh position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]}>
                    <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                    <meshBasicMaterial map={back} toneMapped={false} side={THREE.FrontSide}/>
                </mesh>
            </group>
        </>
    )
}

// Flag discs sit ~FLAG_LIFT above the surface; treat stadium label as conflicting
// if the stadium is within ~25° of either flag's country centroid.
const FLAG_CONFLICT_ANGLE = 25 * (Math.PI / 180)

// Cross-section of the tiered seating bowl, revolved around the local Y axis:
// an inner pitch-side wall rising through stepped tiers out to the rim.
const STADIUM_BOWL_PROFILE = [
    new THREE.Vector2(0.028, 0.000),
    new THREE.Vector2(0.030, 0.011),
    new THREE.Vector2(0.036, 0.013),
    new THREE.Vector2(0.043, 0.020),
    new THREE.Vector2(0.050, 0.023),
    new THREE.Vector2(0.056, 0.032),
]
// The overhanging roof ring: it sits on the rim and reaches back in over the
// stands, leaving the pitch open to the sky.
const STADIUM_ROOF_PROFILE = [
    new THREE.Vector2(0.056, 0.033),
    new THREE.Vector2(0.058, 0.035),
    new THREE.Vector2(0.041, 0.031),
]
// Overall size multiplier applied on top of the modelled dimensions.
const STADIUM_SCALE = 0.85
const STADIUM_LABEL_HEIGHT = 0.055 * STADIUM_SCALE
// Oval footprint: stretch the revolved (circular) geometry along one axis, then
// apply the overall size multiplier.
const STADIUM_OVAL_SCALE: [number, number, number] = [1.35 * STADIUM_SCALE, STADIUM_SCALE, STADIUM_SCALE]
const STADIUM_FLOODLIGHT_ANGLES = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]

// A corner floodlight: a slim pylon topped by a tilted, glowing lamp bank.
function Floodlight({angle}: {angle: number}) {
    return (
        <group rotation={[0, angle, 0]}>
            <group position={[0.060, 0, 0]}>
                <mesh position={[0, 0.024, 0]}>
                    <cylinderGeometry args={[0.0016, 0.0024, 0.048, 8]}/>
                    <meshStandardMaterial color="#64748b" roughness={0.6} metalness={0.3}/>
                </mesh>
                <group position={[0, 0.05, 0]} rotation={[0, 0, 0.4]}>
                    <mesh>
                        <boxGeometry args={[0.006, 0.005, 0.016]}/>
                        <meshStandardMaterial color="#fff7cc" emissive="#fbbf24" emissiveIntensity={1.4} toneMapped={false}/>
                    </mesh>
                </group>
            </group>
        </group>
    )
}

function StadiumMarker({position, name, labelLeft}: {position: THREE.Vector3; name: string; labelLeft: boolean}) {
    // Orient the model so its local up axis follows the globe's surface normal,
    // standing the stadium upright wherever it lands.
    const quaternion = useMemo(() => {
        const normal = position.clone().normalize()
        return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
    }, [position])

    return (
        <group position={position} quaternion={quaternion}>
            <group scale={STADIUM_OVAL_SCALE}>
                {/* Pitch */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0015, 0]}>
                    <circleGeometry args={[0.028, 48]}/>
                    <meshStandardMaterial color="#15803d" roughness={0.95} side={THREE.DoubleSide}/>
                </mesh>
                {/* Centre circle */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0028, 0]}>
                    <ringGeometry args={[0.008, 0.0094, 32]}/>
                    <meshStandardMaterial color="#ecfdf5" emissive="#bbf7d0" emissiveIntensity={0.3} side={THREE.DoubleSide}/>
                </mesh>
                {/* Halfway line */}
                <mesh position={[0, 0.0028, 0]}>
                    <boxGeometry args={[0.0016, 0.0004, 0.052]}/>
                    <meshStandardMaterial color="#ecfdf5" emissive="#bbf7d0" emissiveIntensity={0.3}/>
                </mesh>
                {/* Outer facade wall, from the ground up to the rim */}
                <mesh position={[0, 0.016, 0]}>
                    <cylinderGeometry args={[0.056, 0.056, 0.032, 48, 1, true]}/>
                    <meshStandardMaterial color="#cbd5e1" roughness={0.7} metalness={0.08} side={THREE.DoubleSide}/>
                </mesh>
                {/* Tiered seating bowl */}
                <mesh>
                    <latheGeometry args={[STADIUM_BOWL_PROFILE, 48]}/>
                    <meshStandardMaterial color="#94a3b8" roughness={0.75} metalness={0.05} side={THREE.DoubleSide}/>
                </mesh>
                {/* Overhanging roof */}
                <mesh>
                    <latheGeometry args={[STADIUM_ROOF_PROFILE, 48]}/>
                    <meshStandardMaterial color="#f1f5f9" roughness={0.5} metalness={0.1} side={THREE.DoubleSide}/>
                </mesh>
                {STADIUM_FLOODLIGHT_ANGLES.map(a => <Floodlight key={a} angle={a}/>)}
            </group>
            <Html distanceFactor={4} position={[0, STADIUM_LABEL_HEIGHT, 0]} style={{pointerEvents: "none", whiteSpace: "nowrap", transform: labelLeft ? "translate(-100%, -50%)" : "translateY(-50%)"}}>
                <span className={`inline-block rounded-full bg-white/80 border border-slate-200 text-amber-500 dark:bg-black/50 dark:border-white/10 dark:text-amber-400 px-3 py-1 text-xs font-semibold backdrop-blur${labelLeft ? " mr-2" : " ml-2"}`}>
                    {name}
                </span>
            </Html>
        </group>
    )
}

function Scene({homeCode, awayCode, venue, enableControls, userStopped, onUserStop}: {homeCode: string; awayCode: string; venue?: string; enableControls: boolean; userStopped: boolean; onUserStop: () => void}) {
    const anim = useRef<AnimState>({phase: "draw", progress: 0, tourLeg: 0, tourFrom: new THREE.Vector3(0, 0, 1)})
    const stadium = useMemo(() => resolveStadium(venue), [venue])
    const [introDone, setIntroDone] = useState(false)
    const controlsRef = useRef<{setAzimuthalAngle: (v: number) => void; setPolarAngle: (v: number) => void; update: () => void} | null>(null)

    useEffect(() => {
        setIntroDone(false)
    }, [homeCode, awayCode, stadium])

    const {arcs, aPos, bPos, stadiumPos, tourLegs} = useMemo(() => {
        const hc = COUNTRY_COORDS[homeCode]
        const ac = COUNTRY_COORDS[awayCode]
        const aDir = hc ? latLngToVec3(hc[0], hc[1], 1) : new THREE.Vector3(1, 0, 0)
        const bDir = ac ? latLngToVec3(ac[0], ac[1], 1) : new THREE.Vector3(-1, 0, 0)
        // Each endpoint launches from the top of its country's extrusion (if any)
        // so arcs and pins ride the raised land instead of sinking under it.
        const aRadius = countryGroundRadius(homeCode)
        const bRadius = countryGroundRadius(awayCode)
        if (stadium) {
            const sDir = latLngToVec3(stadium.lat, stadium.lng, 1)
            // The venue always sits in a host nation; if that host is playing it
            // is extruded, so rest the stadium on the raised top.
            const hostCode = HOST_NATION_CODE[stadium.country]
            const hostExtruded = hostCode === homeCode || hostCode === awayCode
            const sRadius = hostExtruded ? COUNTRY_FILL_TOP : GLOBE_RADIUS + STADIUM_BASE_OFFSET
            const arcHome = visibleArc(aDir, sDir, aRadius, sRadius)
            const arcAway = visibleArc(bDir, sDir, bRadius, sRadius)
            return {
                arcs: [arcHome, arcAway],
                aPos: aDir.clone().multiplyScalar(aRadius),
                bPos: bDir.clone().multiplyScalar(bRadius),
                stadiumPos: sDir.clone().multiplyScalar(sRadius),
                tourLegs: [arcHome, [...arcAway].reverse(), arcAway, [...arcHome].reverse()],
            }
        }
        const arcHA = visibleArc(aDir, bDir, aRadius, bRadius)
        return {
            arcs: [arcHA],
            aPos: aDir.clone().multiplyScalar(aRadius),
            bPos: bDir.clone().multiplyScalar(bRadius),
            stadiumPos: undefined,
            tourLegs: [arcHA, [...arcHA].reverse()],
        }
    }, [homeCode, awayCode, stadium])

    const hasHome = Boolean(COUNTRY_COORDS[homeCode])
    const hasAway = Boolean(COUNTRY_COORDS[awayCode])

    const stadiumLabelLeft = useMemo(() => {
        if (!stadiumPos) return false
        const sDir = stadiumPos.clone().normalize()
        return [aPos, bPos].some(p => sDir.angleTo(p.clone().normalize()) < FLAG_CONFLICT_ANGLE)
    }, [stadiumPos, aPos, bPos])

    return (
        <>
            <CameraRig
                homeCode={homeCode}
                awayCode={awayCode}
                stadium={stadium}
                anim={anim}
                tourLegs={tourLegs}
                controlsRef={controlsRef}
                userStopped={userStopped}
                onIntroComplete={() => setIntroDone(true)}
            />
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS, 64, 64]}/>
                <meshStandardMaterial color="#1e3a5f" roughness={0.75} metalness={0.15}/>
            </mesh>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS + 0.003, 48, 48]}/>
                <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.08}/>
            </mesh>
            <Continents/>
            {hasHome && <CountryFill code={homeCode} color="#67e8f9"/>}
            {hasAway && <CountryFill code={awayCode} color="#818cf8"/>}
            {arcs.map((points, i) => (
                <AnimatedArc key={i} points={points} anim={anim}/>
            ))}
            {stadiumPos && <StadiumMarker position={stadiumPos} name={stadium!.name} labelLeft={stadiumLabelLeft}/>}
            <React.Suspense fallback={null}>
                {hasHome && <FocusFlag code={homeCode} position={aPos} anchorRadius={countryGroundRadius(homeCode)}/>}
                {hasAway && <FocusFlag code={awayCode} position={bPos} anchorRadius={countryGroundRadius(awayCode)}/>}
            </React.Suspense>
            {enableControls && introDone && (
                <OrbitControls
                    ref={controlsRef as never}
                    enableZoom={false}
                    enablePan={false}
                    rotateSpeed={0.5}
                    enableDamping
                    dampingFactor={0.08}
                    onStart={onUserStop}
                />
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

export default function FocusedGlobe({homeCode, awayCode, venue}: {homeCode: string; awayCode: string; venue?: string}): React.JSX.Element {
    const coarsePointer = useCoarsePointer()
    const interactive = !coarsePointer
    const [userStopped, setUserStopped] = useState(false)

    useEffect(() => {
        setUserStopped(false)
    }, [homeCode, awayCode, venue])

    return (
        <div className={`relative h-full w-full ${interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}>
            <Canvas camera={{position: [0, 0, 5], fov: 42}} gl={{antialias: true, alpha: true}} dpr={[1, 1.5]}>
                <ambientLight intensity={0.75}/>
                <directionalLight position={[5, 3, 5]} intensity={1.1}/>
                <pointLight position={[-5, -3, -5]} intensity={0.4} color="#22d3ee"/>
                <Scene
                    homeCode={homeCode}
                    awayCode={awayCode}
                    venue={venue}
                    enableControls={interactive}
                    userStopped={userStopped}
                    onUserStop={() => setUserStopped(true)}
                />
            </Canvas>
        </div>
    )
}
