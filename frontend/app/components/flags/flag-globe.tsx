'use client'

import React, {useEffect, useMemo, useRef, useState} from "react"
import {Canvas, useFrame} from "@react-three/fiber"
import {Line, OrbitControls, useTexture} from "@react-three/drei"
import * as THREE from "three"
import {useTheme} from "next-themes"
import {COUNTRY_COORDS} from "./country-coords"
import {WORLD_CUP_2026_STADIUMS} from "./stadium-coords"
import {GLOBE_RADIUS, latLngToVec3, buildContinentGeometry, orientationForPosition, cropSquare} from "./globe-utils"

const FLAG_RADIUS = 1.92
const FLAG_DISC_RADIUS = 0.09
const FLAG_BORDER_WIDTH = 0.012
const MIN_ANGLE = 0.11
const RELAX_ITERATIONS = 220

const COUNTRY_CODES = Object.keys(COUNTRY_COORDS)
const FLAG_URLS = COUNTRY_CODES.map(c => `https://flagcdn.com/w80/${c}.png`)

export type Match = {home: string; away: string}

function relaxOnSphere(dirs: THREE.Vector3[], minAngle: number, iterations: number): THREE.Vector3[] {
    const result = dirs.map(d => d.clone().normalize())
    const tmpAxis = new THREE.Vector3()
    for (let it = 0; it < iterations; it++) {
        let moved = false
        for (let i = 0; i < result.length; i++) {
            for (let j = i + 1; j < result.length; j++) {
                const a = result[i]
                const b = result[j]
                const angle = a.angleTo(b)
                if (angle < minAngle) {
                    tmpAxis.crossVectors(a, b)
                    if (tmpAxis.lengthSq() < 1e-8) {
                        tmpAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
                    }
                    tmpAxis.normalize()
                    const delta = (minAngle - angle) * 0.5 + 0.002
                    a.applyAxisAngle(tmpAxis, -delta).normalize()
                    b.applyAxisAngle(tmpAxis, delta).normalize()
                    moved = true
                }
            }
        }
        if (!moved) break
    }
    return result
}

function greatCircleArc(aDir: THREE.Vector3, bDir: THREE.Vector3, steps = 48, lift = 0.18): THREE.Vector3[] {
    const a = aDir.clone().normalize()
    const b = bDir.clone().normalize()
    const angle = a.angleTo(b)
    const axis = new THREE.Vector3().crossVectors(a, b)
    if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0)
    axis.normalize()

    const points: THREE.Vector3[] = []
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const dir = a.clone().applyAxisAngle(axis, angle * t)
        const r = GLOBE_RADIUS + 0.012 + lift * Math.sin(Math.PI * t)
        points.push(dir.multiplyScalar(r))
    }
    return points
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

function Matches({matches}: {matches: Match[]}) {
    const arcs = useMemo(() =>
        matches.flatMap(m => {
            const a = COUNTRY_COORDS[m.home]
            const b = COUNTRY_COORDS[m.away]
            if (!a || !b) return []
            const aDir = latLngToVec3(a[0], a[1], 1)
            const bDir = latLngToVec3(b[0], b[1], 1)
            return [{key: `${m.home}-${m.away}`, points: greatCircleArc(aDir, bDir)}]
        }),
    [matches])

    return (
        <>
            {arcs.map(arc => (
                <Line key={arc.key} points={arc.points} color="#fbbf24" lineWidth={1.6} transparent opacity={0.9}/>
            ))}
        </>
    )
}

function Stadiums() {
    const positions = useMemo(
        () => WORLD_CUP_2026_STADIUMS.map(s => latLngToVec3(s.lat, s.lng, GLOBE_RADIUS + 0.006)),
        [],
    )
    return (
        <>
            {positions.map((pos, i) => (
                <mesh key={WORLD_CUP_2026_STADIUMS[i].city} position={pos}>
                    <sphereGeometry args={[0.014, 12, 12]}/>
                    <meshBasicMaterial color="#fbbf24"/>
                </mesh>
            ))}
        </>
    )
}

function Continents() {
    const geometry = useMemo(() => buildContinentGeometry(GLOBE_RADIUS + 0.008), [])
    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={0.55}/>
        </lineSegments>
    )
}

function StarField() {
    const fieldRef = useRef<THREE.Group>(null)
    const twinkleRef = useRef<THREE.Points>(null)

    const pinpricks = useMemo(() => {
        const count = 1800
        const positions = new Float32Array(count * 3)
        const sizes = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            const u = Math.random()
            const v = Math.random()
            const theta = 2 * Math.PI * u
            const phi = Math.acos(2 * v - 1)
            const r = 28 + Math.random() * 14
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = r * Math.cos(phi)
            sizes[i] = 0.02 + Math.random() * 0.06
        }
        return {positions, sizes, count}
    }, [])

    const twinkle = useMemo(() => {
        const count = 70
        const positions = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)
        const phases = new Float32Array(count)
        const warm = new THREE.Color("#fde68a")
        const cool = new THREE.Color("#a5f3fc")
        const white = new THREE.Color("#ffffff")
        for (let i = 0; i < count; i++) {
            const u = Math.random()
            const v = Math.random()
            const theta = 2 * Math.PI * u
            const phi = Math.acos(2 * v - 1)
            const r = 24 + Math.random() * 8
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = r * Math.cos(phi)
            const pick = Math.random()
            const c = pick < 0.33 ? warm : pick < 0.66 ? cool : white
            colors[i * 3] = c.r
            colors[i * 3 + 1] = c.g
            colors[i * 3 + 2] = c.b
            phases[i] = Math.random() * Math.PI * 2
        }
        return {positions, colors, phases, count}
    }, [])

    useFrame((state, delta) => {
        if (fieldRef.current) fieldRef.current.rotation.y += delta * 0.01
        if (twinkleRef.current) {
            const mat = twinkleRef.current.material as THREE.PointsMaterial
            const t = state.clock.elapsedTime
            mat.opacity = 0.75 + Math.sin(t * 0.9) * 0.15
        }
    })

    return (
        <group ref={fieldRef}>
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[pinpricks.positions, 3]}
                        count={pinpricks.count}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#ffffff"
                    size={0.05}
                    sizeAttenuation
                    transparent
                    opacity={0.7}
                    depthWrite={false}
                />
            </points>
            <points ref={twinkleRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[twinkle.positions, 3]}
                        count={twinkle.count}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        args={[twinkle.colors, 3]}
                        count={twinkle.count}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.18}
                    sizeAttenuation
                    transparent
                    opacity={0.85}
                    vertexColors
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    )
}

function Flags() {
    const textures = useTexture(FLAG_URLS) as THREE.Texture[]

    const markers = useMemo(() => {
        const anchors = COUNTRY_CODES.map(code => {
            const [lat, lng] = COUNTRY_COORDS[code]
            return latLngToVec3(lat, lng, 1)
        })
        const relaxed = relaxOnSphere(anchors, MIN_ANGLE, RELAX_ITERATIONS)

        return COUNTRY_CODES.map((code, i) => {
            const anchorPos = anchors[i].clone().multiplyScalar(GLOBE_RADIUS + 0.005)
            const flagPos = relaxed[i].clone().multiplyScalar(FLAG_RADIUS)
            const frontTex = cropSquare(textures[i])
            return {
                code,
                anchorPos,
                flagPos,
                rotation: orientationForPosition(flagPos),
                frontTexture: frontTex,
                backTexture: mirrorHorizontally(frontTex),
            }
        })
    }, [textures])

    return (
        <>
            {markers.map(({code, anchorPos, flagPos, rotation, frontTexture, backTexture}) => (
                <group key={code}>
                    <mesh position={anchorPos}>
                        <sphereGeometry args={[0.012, 10, 10]}/>
                        <meshBasicMaterial color="#22d3ee"/>
                    </mesh>
                    <Line points={[anchorPos, flagPos]} color="#22d3ee" lineWidth={0.8} transparent opacity={0.45}/>
                    <group position={flagPos} rotation={rotation}>
                        <mesh>
                            <circleGeometry args={[FLAG_DISC_RADIUS + FLAG_BORDER_WIDTH, 48]}/>
                            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide}/>
                        </mesh>
                        <mesh position={[0, 0, 0.001]}>
                            <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                            <meshBasicMaterial map={frontTexture} toneMapped={false} side={THREE.FrontSide}/>
                        </mesh>
                        <mesh position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]}>
                            <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                            <meshBasicMaterial map={backTexture} toneMapped={false} side={THREE.FrontSide}/>
                        </mesh>
                    </group>
                </group>
            ))}
        </>
    )
}

function Globe({matches}: {matches: Match[]}) {
    const groupRef = useRef<THREE.Group>(null)
    useFrame((_, delta) => {
        if (groupRef.current) groupRef.current.rotation.y += delta * 0.08
    })

    return (
        <group ref={groupRef}>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS, 64, 64]}/>
                <meshStandardMaterial color="#1e3a5f" roughness={0.75} metalness={0.15}/>
            </mesh>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS + 0.003, 48, 48]}/>
                <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.08}/>
            </mesh>
            <Continents/>
            <Stadiums/>
            <Matches matches={matches}/>
            <React.Suspense fallback={null}>
                <Flags/>
            </React.Suspense>
        </group>
    )
}

const DEFAULT_MATCHES: Match[] = []

interface FlagGlobeProps {
    matches?: Match[]
    interactive?: boolean
}

function useCoarsePointer(): boolean {
    const [coarse, setCoarse] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia("(pointer: coarse)")
        const update = () => setCoarse(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    return coarse
}

export default function FlagGlobe({matches = DEFAULT_MATCHES, interactive = true}: FlagGlobeProps = {}): React.JSX.Element {
    const coarsePointer = useCoarsePointer()
    const effectiveInteractive = interactive && !coarsePointer
    const {resolvedTheme} = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    const showStars = mounted && resolvedTheme === "dark"
    return (
        <div className={`relative h-full w-full ${effectiveInteractive ? "" : "pointer-events-none"}`}>
            <Canvas camera={{position: [0, 0, 5.2], fov: 45}} gl={{antialias: true, alpha: true}} dpr={[1, 1.5]}>
                <ambientLight intensity={0.7}/>
                <directionalLight position={[5, 3, 5]} intensity={1.1}/>
                <pointLight position={[-5, -3, -5]} intensity={0.4} color="#22d3ee"/>
                {showStars && <StarField/>}
                <Globe matches={matches}/>
                {effectiveInteractive && (
                    <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} enableDamping dampingFactor={0.08}/>
                )}
            </Canvas>
        </div>
    )
}
