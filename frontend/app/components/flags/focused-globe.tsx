'use client'

import React, {useEffect, useMemo, useRef, useState} from "react"
import {Canvas, useFrame, useThree} from "@react-three/fiber"
import {Line, useTexture} from "@react-three/drei"
import * as THREE from "three"
import {feature} from "topojson-client"
import type {Topology, GeometryCollection} from "topojson-specification"
import type {Feature, FeatureCollection, MultiPolygon, Polygon, Position} from "geojson"
import landTopo from "world-atlas/land-110m.json"
import {COUNTRY_COORDS} from "./country-coords"

const GLOBE_RADIUS = 1.5
const FLAG_DISC_RADIUS = 0.14
const FLAG_BORDER_WIDTH = 0.018

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * Math.PI / 180
    const theta = (lng + 180) * Math.PI / 180
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    )
}

function buildContinentGeometry(radius: number): THREE.BufferGeometry {
    const topo = landTopo as unknown as Topology
    const result = feature(topo, topo.objects.land as GeometryCollection) as unknown as
        | Feature<Polygon | MultiPolygon>
        | FeatureCollection<Polygon | MultiPolygon>

    const features: Feature<Polygon | MultiPolygon>[] =
        "features" in result ? result.features : [result]

    const positions: number[] = []
    const addSegment = (a: Position, b: Position) => {
        const p1 = latLngToVec3(a[1], a[0], radius)
        const p2 = latLngToVec3(b[1], b[0], radius)
        positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
    }
    const addRing = (ring: Position[]) => {
        for (let i = 0; i < ring.length - 1; i++) addSegment(ring[i], ring[i + 1])
    }

    for (const f of features) {
        const geom = f.geometry
        if (!geom) continue
        if (geom.type === "Polygon") for (const ring of geom.coordinates) addRing(ring)
        else if (geom.type === "MultiPolygon") for (const polygon of geom.coordinates) for (const ring of polygon) addRing(ring)
    }

    const bufferGeom = new THREE.BufferGeometry()
    bufferGeom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    return bufferGeom
}

function visibleArc(aDir: THREE.Vector3, bDir: THREE.Vector3, steps = 64): THREE.Vector3[] {
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
    const bulge = 0.25 + angle * 0.55
    const control = mid.clone().multiplyScalar(GLOBE_RADIUS + bulge)

    const aPos = aN.clone().multiplyScalar(GLOBE_RADIUS + 0.012)
    const bPos = bN.clone().multiplyScalar(GLOBE_RADIUS + 0.012)

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

function cropSquare(source: THREE.Texture): THREE.Texture {
    const tex = source.clone()
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    const img = source.image as {width?: number; height?: number} | undefined
    const w = img?.width ?? 1
    const h = img?.height ?? 1
    if (w >= h) {
        tex.offset.set((w - h) / 2 / w, 0)
        tex.repeat.set(h / w, 1)
    } else {
        tex.offset.set(0, (h - w) / 2 / h)
        tex.repeat.set(1, w / h)
    }
    tex.needsUpdate = true
    return tex
}

function orientationForPosition(pos: THREE.Vector3): THREE.Euler {
    const normal = pos.clone().normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    return new THREE.Euler().setFromQuaternion(quaternion)
}

const TRAVEL_SECONDS = 0.7
const ARC_DRAW_SECONDS = 0.9

type Phase = "travel" | "draw" | "done"

interface AnimState {
    phase: Phase
    progress: number
}

function AnimatedArc({points, anim}: {points: THREE.Vector3[]; anim: React.RefObject<AnimState>}) {
    const [, setTick] = useState(0)

    useFrame(() => {
        if (anim.current.phase !== "done") setTick(t => t + 1)
    })

    const visiblePoints = useMemo(() => {
        const {phase, progress} = anim.current
        if (phase === "travel") return [points[0], points[0]]
        const p = phase === "done" ? 1 : progress
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

function Continents() {
    const geometry = useMemo(() => buildContinentGeometry(GLOBE_RADIUS + 0.008), [])
    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={0.45}/>
        </lineSegments>
    )
}

function FocusFlag({code, position}: {code: string; position: THREE.Vector3}) {
    const texture = useTexture(`https://flagcdn.com/w160/${code}.png`) as THREE.Texture
    const front = useMemo(() => cropSquare(texture), [texture])
    const rotation = useMemo(() => orientationForPosition(position), [position])
    const raised = useMemo(() => position.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.05), [position])

    return (
        <group position={raised} rotation={rotation}>
            <mesh>
                <circleGeometry args={[FLAG_DISC_RADIUS + FLAG_BORDER_WIDTH, 48]}/>
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide}/>
            </mesh>
            <mesh position={[0, 0, 0.001]}>
                <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                <meshBasicMaterial map={front} toneMapped={false} side={THREE.FrontSide}/>
            </mesh>
        </group>
    )
}

function cameraPath(homeCode: string, awayCode: string): {startPos: THREE.Vector3; endPos: THREE.Vector3} {
    const hc = COUNTRY_COORDS[homeCode]
    const ac = COUNTRY_COORDS[awayCode]
    const fallback = new THREE.Vector3(0, 0, 5)
    if (!hc || !ac) return {startPos: fallback, endPos: fallback}

    const aDir = latLngToVec3(hc[0], hc[1], 1)
    const bDir = latLngToVec3(ac[0], ac[1], 1)
    const mid = aDir.clone().add(bDir)
    if (mid.lengthSq() < 1e-6) {
        const axis = new THREE.Vector3().crossVectors(aDir, new THREE.Vector3(0, 1, 0)).normalize()
        mid.copy(aDir).applyAxisAngle(axis, Math.PI / 2)
    }
    mid.normalize()

    const angle = aDir.angleTo(bDir)
    const distance = THREE.MathUtils.clamp(2.7 + angle * 1.35, 3.0, 5.6)
    const startPos = aDir.clone().normalize().multiplyScalar(distance)
    const endPos = mid.clone().multiplyScalar(distance)
    return {startPos, endPos}
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

function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function CameraRig({homeCode, awayCode, anim}: {homeCode: string; awayCode: string; anim: React.RefObject<AnimState>}) {
    const {camera} = useThree()
    const {startPos, endPos} = useMemo(() => cameraPath(homeCode, awayCode), [homeCode, awayCode])
    const travelOrigin = useRef(new THREE.Vector3(0, 0, 5))
    const initialized = useRef(false)

    useEffect(() => {
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
                a.phase = "done"
            }
        }
    })

    return null
}

function Scene({homeCode, awayCode}: {homeCode: string; awayCode: string}) {
    const anim = useRef<AnimState>({phase: "draw", progress: 0})

    const {aDir, bDir, arcPoints, aPos, bPos} = useMemo(() => {
        const hc = COUNTRY_COORDS[homeCode]
        const ac = COUNTRY_COORDS[awayCode]
        const aDir = hc ? latLngToVec3(hc[0], hc[1], 1) : new THREE.Vector3(1, 0, 0)
        const bDir = ac ? latLngToVec3(ac[0], ac[1], 1) : new THREE.Vector3(-1, 0, 0)
        const arcPoints = visibleArc(aDir, bDir)
        const aPos = aDir.clone().multiplyScalar(GLOBE_RADIUS)
        const bPos = bDir.clone().multiplyScalar(GLOBE_RADIUS)
        return {aDir, bDir, arcPoints, aPos, bPos}
    }, [homeCode, awayCode])

    const hasHome = Boolean(COUNTRY_COORDS[homeCode])
    const hasAway = Boolean(COUNTRY_COORDS[awayCode])

    void aDir
    void bDir

    return (
        <>
            <CameraRig homeCode={homeCode} awayCode={awayCode} anim={anim}/>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS, 64, 64]}/>
                <meshStandardMaterial color="#1e3a5f" roughness={0.75} metalness={0.15}/>
            </mesh>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS + 0.003, 48, 48]}/>
                <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.08}/>
            </mesh>
            <Continents/>
            <AnimatedArc points={arcPoints} anim={anim}/>
            {hasHome && (
                <mesh position={aPos}>
                    <sphereGeometry args={[0.018, 12, 12]}/>
                    <meshBasicMaterial color="#fbbf24"/>
                </mesh>
            )}
            {hasAway && (
                <mesh position={bPos}>
                    <sphereGeometry args={[0.018, 12, 12]}/>
                    <meshBasicMaterial color="#fbbf24"/>
                </mesh>
            )}
            <React.Suspense fallback={null}>
                {hasHome && <FocusFlag code={homeCode} position={aPos}/>}
                {hasAway && <FocusFlag code={awayCode} position={bPos}/>}
            </React.Suspense>
        </>
    )
}

interface FocusedGlobeProps {
    homeCode: string
    awayCode: string
}

export default function FocusedGlobe({homeCode, awayCode}: FocusedGlobeProps): React.JSX.Element {
    return (
        <div className="relative h-full w-full pointer-events-none">
            <Canvas
                camera={{position: [0, 0, 5], fov: 42}}
                gl={{antialias: true, alpha: true}}
                dpr={[1, 1.5]}
            >
                <ambientLight intensity={0.75}/>
                <directionalLight position={[5, 3, 5]} intensity={1.1}/>
                <pointLight position={[-5, -3, -5]} intensity={0.4} color="#22d3ee"/>
                <Scene homeCode={homeCode} awayCode={awayCode}/>
            </Canvas>
        </div>
    )
}
