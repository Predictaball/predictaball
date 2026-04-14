'use client'

import React, {useMemo, useRef} from "react"
import {Canvas, useFrame} from "@react-three/fiber"
import {Line, OrbitControls, useTexture} from "@react-three/drei"
import * as THREE from "three"

const GLOBE_RADIUS = 1.5
const FLAG_RADIUS = 1.92
const FLAG_DISC_RADIUS = 0.09
const FLAG_BORDER_WIDTH = 0.012
const MIN_ANGLE = 0.11
const RELAX_ITERATIONS = 220

const COUNTRY_COORDS: Record<string, [number, number]> = {
    "mx": [23.6, -102.5], "za": [-30.6, 22.9], "kr": [35.9, 127.8], "cz": [49.8, 15.5],
    "ca": [56.1, -106.3], "ba": [43.9, 17.7], "qa": [25.4, 51.2], "ch": [46.8, 8.2],
    "br": [-14.2, -51.9], "ma": [31.8, -7.1], "ht": [18.9, -72.3], "gb-sct": [56.5, -4.2],
    "us": [37.1, -95.7], "py": [-23.4, -58.4], "au": [-25.3, 133.8], "tr": [38.9, 35.2],
    "de": [51.2, 10.4], "cw": [12.2, -69.0], "ci": [7.5, -5.5], "ec": [-1.8, -78.2],
    "nl": [52.1, 5.3], "jp": [36.2, 138.3], "se": [60.1, 18.6], "tn": [33.9, 9.5],
    "be": [50.5, 4.5], "eg": [26.8, 30.8], "ir": [32.4, 53.7], "nz": [-40.9, 174.9],
    "es": [40.5, -3.7], "cv": [16.5, -23.0], "sa": [23.9, 45.1], "uy": [-32.5, -55.8],
    "fr": [46.2, 2.2], "sn": [14.5, -14.5], "iq": [33.2, 43.7], "no": [60.5, 8.5],
    "ar": [-38.4, -63.6], "dz": [28.0, 1.7], "at": [47.5, 14.6], "jo": [30.6, 36.2],
    "pt": [39.4, -8.2], "cd": [-4.0, 21.8], "uz": [41.4, 64.6], "co": [4.6, -74.3],
    "gb-eng": [52.4, -1.8], "hr": [45.1, 15.2], "gh": [7.9, -1.0], "pa": [8.5, -80.8],
}

const COUNTRY_CODES = Object.keys(COUNTRY_COORDS)
const FLAG_URLS = COUNTRY_CODES.map(c => `https://flagcdn.com/w80/${c}.png`)

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * Math.PI / 180
    const theta = (lng + 180) * Math.PI / 180
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    )
}

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

function orientationForPosition(pos: THREE.Vector3): THREE.Euler {
    const normal = pos.clone().normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal,
    )
    return new THREE.Euler().setFromQuaternion(quaternion)
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
            return {
                code,
                anchorPos,
                flagPos,
                rotation: orientationForPosition(flagPos),
                texture: cropSquare(textures[i]),
            }
        })
    }, [textures])

    return (
        <>
            {markers.map(({code, anchorPos, flagPos, rotation, texture}) => (
                <group key={code}>
                    <mesh position={anchorPos}>
                        <sphereGeometry args={[0.012, 10, 10]}/>
                        <meshBasicMaterial color="#22d3ee"/>
                    </mesh>
                    <Line
                        points={[anchorPos, flagPos]}
                        color="#22d3ee"
                        lineWidth={0.8}
                        transparent
                        opacity={0.45}
                    />
                    <group position={flagPos} rotation={rotation}>
                        <mesh position={[0, 0, -0.001]}>
                            <circleGeometry args={[FLAG_DISC_RADIUS + FLAG_BORDER_WIDTH, 48]}/>
                            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide}/>
                        </mesh>
                        <mesh>
                            <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                            <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide}/>
                        </mesh>
                    </group>
                </group>
            ))}
        </>
    )
}

function Globe() {
    const groupRef = useRef<THREE.Group>(null)

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.08
        }
    })

    return (
        <group ref={groupRef}>
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS, 64, 64]}/>
                <meshStandardMaterial
                    color="#1e3a5f"
                    roughness={0.75}
                    metalness={0.15}
                />
            </mesh>

            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS + 0.003, 48, 48]}/>
                <meshBasicMaterial
                    color="#22d3ee"
                    wireframe
                    transparent
                    opacity={0.15}
                />
            </mesh>

            <React.Suspense fallback={null}>
                <Flags/>
            </React.Suspense>
        </group>
    )
}

export default function FlagGlobe(): React.JSX.Element {
    return (
        <div className="relative h-full w-full overflow-visible">
            <Canvas
                camera={{position: [0, 0, 5], fov: 45}}
                gl={{antialias: true, alpha: true}}
                dpr={[1, 1.5]}
            >
                <ambientLight intensity={0.7}/>
                <directionalLight position={[5, 3, 5]} intensity={1.1}/>
                <pointLight position={[-5, -3, -5]} intensity={0.4} color="#22d3ee"/>
                <Globe/>
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    rotateSpeed={0.5}
                    enableDamping
                    dampingFactor={0.08}
                />
            </Canvas>
        </div>
    )
}
