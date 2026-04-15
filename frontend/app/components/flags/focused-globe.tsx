'use client'

import React, {useMemo, useRef} from "react"
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

function greatCircleArc(aDir: THREE.Vector3, bDir: THREE.Vector3, steps = 64, lift = 0.35): THREE.Vector3[] {
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

function cameraTargetFor(homeCode: string, awayCode: string): {pos: THREE.Vector3; up: THREE.Vector3} {
    const hc = COUNTRY_COORDS[homeCode]
    const ac = COUNTRY_COORDS[awayCode]
    if (!hc || !ac) {
        return {pos: new THREE.Vector3(0, 0, 5), up: new THREE.Vector3(0, 1, 0)}
    }
    const aDir = latLngToVec3(hc[0], hc[1], 1)
    const bDir = latLngToVec3(ac[0], ac[1], 1)
    const midpoint = aDir.clone().add(bDir)
    if (midpoint.lengthSq() < 1e-6) {
        const axis = new THREE.Vector3().crossVectors(aDir, new THREE.Vector3(0, 1, 0)).normalize()
        midpoint.copy(aDir).applyAxisAngle(axis, Math.PI / 2)
    }
    midpoint.normalize()

    const angle = aDir.angleTo(bDir)
    const distance = THREE.MathUtils.clamp(2.7 + angle * 1.35, 3.0, 5.6)
    const pos = midpoint.clone().multiplyScalar(distance)
    return {pos, up: new THREE.Vector3(0, 1, 0)}
}

function CameraRig({homeCode, awayCode}: {homeCode: string; awayCode: string}) {
    const {camera} = useThree()
    const target = useMemo(() => cameraTargetFor(homeCode, awayCode), [homeCode, awayCode])
    const initialized = useRef(false)

    useFrame(() => {
        if (!initialized.current) {
            camera.position.copy(target.pos)
            camera.lookAt(0, 0, 0)
            initialized.current = true
            return
        }
        camera.position.lerp(target.pos, 0.06)
        camera.lookAt(0, 0, 0)
    })

    return null
}

function Scene({homeCode, awayCode}: {homeCode: string; awayCode: string}) {
    const {aDir, bDir, arcPoints, aPos, bPos} = useMemo(() => {
        const hc = COUNTRY_COORDS[homeCode]
        const ac = COUNTRY_COORDS[awayCode]
        const aDir = hc ? latLngToVec3(hc[0], hc[1], 1) : new THREE.Vector3(1, 0, 0)
        const bDir = ac ? latLngToVec3(ac[0], ac[1], 1) : new THREE.Vector3(-1, 0, 0)
        const arcPoints = greatCircleArc(aDir, bDir)
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
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS, 64, 64]}/>
                <meshStandardMaterial color="#1e3a5f" roughness={0.75} metalness={0.15}/>
            </mesh>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS + 0.003, 48, 48]}/>
                <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.08}/>
            </mesh>
            <Continents/>
            <Line points={arcPoints} color="#fbbf24" lineWidth={2.2} transparent opacity={0.95}/>
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
                <CameraRig homeCode={homeCode} awayCode={awayCode}/>
                <Scene homeCode={homeCode} awayCode={awayCode}/>
            </Canvas>
        </div>
    )
}
