'use client'

import React, {useEffect, useMemo, useRef, useState} from "react"
import {Canvas, useFrame, useThree} from "@react-three/fiber"
import {Line, useTexture} from "@react-three/drei"
import * as THREE from "three"
import {COUNTRY_COORDS} from "./country-coords"
import {GLOBE_RADIUS, latLngToVec3, buildContinentGeometry, cropSquare} from "./globe-utils"

const FLAG_DISC_RADIUS = 0.09
const FLAG_BORDER_WIDTH = 0.012
const FLAG_ANCHOR_OFFSET = 0.005
const FLAG_LIFT = 0.42
const FLAG_CAMERA_TILT = 0.45
const TRAVEL_SECONDS = 0.7
const ARC_DRAW_SECONDS = 0.9

type Phase = "travel" | "draw" | "done"

interface AnimState {
    phase: Phase
    progress: number
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
    return {
        startPos: aDir.clone().normalize().multiplyScalar(distance),
        endPos: mid.clone().multiplyScalar(distance),
    }
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

function Continents() {
    const geometry = useMemo(() => buildContinentGeometry(GLOBE_RADIUS + 0.008), [])
    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={0.45}/>
        </lineSegments>
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

function FocusFlag({code, position}: {code: string; position: THREE.Vector3}) {
    const texture = useTexture(`https://flagcdn.com/w320/${code}.png`) as THREE.Texture
    const front = useMemo(() => cropSquare(texture), [texture])
    const back = useMemo(() => mirrorHorizontally(front), [front])
    const {anchorPos, flagPos, surfaceNormal} = useMemo(() => {
        const dir = position.clone().normalize()
        return {
            anchorPos: dir.clone().multiplyScalar(GLOBE_RADIUS + FLAG_ANCHOR_OFFSET),
            flagPos: dir.clone().multiplyScalar(GLOBE_RADIUS + FLAG_LIFT),
            surfaceNormal: dir.clone(),
        }
    }, [position])

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

function Scene({homeCode, awayCode}: {homeCode: string; awayCode: string}) {
    const anim = useRef<AnimState>({phase: "draw", progress: 0})

    const {arcPoints, aPos, bPos} = useMemo(() => {
        const hc = COUNTRY_COORDS[homeCode]
        const ac = COUNTRY_COORDS[awayCode]
        const aDir = hc ? latLngToVec3(hc[0], hc[1], 1) : new THREE.Vector3(1, 0, 0)
        const bDir = ac ? latLngToVec3(ac[0], ac[1], 1) : new THREE.Vector3(-1, 0, 0)
        return {
            arcPoints: visibleArc(aDir, bDir),
            aPos: aDir.clone().multiplyScalar(GLOBE_RADIUS),
            bPos: bDir.clone().multiplyScalar(GLOBE_RADIUS),
        }
    }, [homeCode, awayCode])

    const hasHome = Boolean(COUNTRY_COORDS[homeCode])
    const hasAway = Boolean(COUNTRY_COORDS[awayCode])

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
            <React.Suspense fallback={null}>
                {hasHome && <FocusFlag code={homeCode} position={aPos}/>}
                {hasAway && <FocusFlag code={awayCode} position={bPos}/>}
            </React.Suspense>
        </>
    )
}

export default function FocusedGlobe({homeCode, awayCode}: {homeCode: string; awayCode: string}): React.JSX.Element {
    return (
        <div className="relative h-full w-full pointer-events-none">
            <Canvas camera={{position: [0, 0, 5], fov: 42}} gl={{antialias: true, alpha: true}} dpr={[1, 1.5]}>
                <ambientLight intensity={0.75}/>
                <directionalLight position={[5, 3, 5]} intensity={1.1}/>
                <pointLight position={[-5, -3, -5]} intensity={0.4} color="#22d3ee"/>
                <Scene homeCode={homeCode} awayCode={awayCode}/>
            </Canvas>
        </div>
    )
}
