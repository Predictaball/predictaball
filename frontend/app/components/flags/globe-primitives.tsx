import React, {useEffect, useMemo, useState} from "react"
import {Line} from "@react-three/drei"
import * as THREE from "three"
import {buildContinentGeometry, GLOBE_RADIUS} from "./globe-utils"

// Shared by both globes: the flag disc's own dimensions and its "not loaded
// yet" placeholder colour.
export const FLAG_DISC_RADIUS = 0.09
export const FLAG_BORDER_WIDTH = 0.012
export const FLAG_PLACEHOLDER_COLOR = "#334155"

// Whether the pointer is coarse (touch), used to default interactive globe
// controls on or off. `initialCoarse` seeds the very first render, before the
// media query can be read on mount.
export function useCoarsePointer(initialCoarse: boolean): boolean {
    const [coarse, setCoarse] = useState(initialCoarse)
    useEffect(() => {
        const mq = window.matchMedia("(pointer: coarse)")
        const update = () => setCoarse(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    return coarse
}

// Wireframe continent outlines. Opacity is left to the caller: the focused
// globe dims them further so the highlighted countries stand out more.
export function Continents({opacity}: {opacity: number}): React.JSX.Element {
    const geometry = useMemo(() => buildContinentGeometry(GLOBE_RADIUS + 0.008), [])
    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={opacity}/>
        </lineSegments>
    )
}

// The solid globe body plus its faint wireframe shell.
export function GlobeSphere(): React.JSX.Element {
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
        </>
    )
}

// Fixed directional/point light rig. Only the ambient fill is left to the
// caller, since the focused globe wants it a touch brighter to keep the
// highlighted country legible.
export function GlobeLights({ambientIntensity}: {ambientIntensity: number}): React.JSX.Element {
    return (
        <>
            <ambientLight intensity={ambientIntensity}/>
            <directionalLight position={[5, 3, 5]} intensity={1.1}/>
            <pointLight position={[-5, -3, -5]} intensity={0.4} color="#22d3ee"/>
        </>
    )
}

interface FlagDiscProps {
    anchorPos: THREE.Vector3
    flagPos: THREE.Vector3
    frontTexture: THREE.Texture | null
    backTexture: THREE.Texture | null
    // Static orientation (flag-globe: fixed once the layout settles). Omit
    // when the caller instead drives orientation imperatively via groupRef
    // (focused-globe: billboards to face the camera every frame).
    rotation?: THREE.Euler
    groupRef?: React.Ref<THREE.Group>
}

// A flag pinned to the globe surface: a small anchor dot, a line rising to the
// disc, and the double-sided disc itself — falling back to a plain placeholder
// while its texture is still loading.
export function FlagDisc({anchorPos, flagPos, frontTexture, backTexture, rotation, groupRef}: FlagDiscProps): React.JSX.Element {
    return (
        <>
            <mesh position={anchorPos}>
                <sphereGeometry args={[0.012, 10, 10]}/>
                <meshBasicMaterial color="#22d3ee"/>
            </mesh>
            <Line points={[anchorPos, flagPos]} color="#22d3ee" lineWidth={0.8} transparent opacity={0.45}/>
            <group ref={groupRef} position={flagPos} rotation={rotation}>
                <mesh>
                    <circleGeometry args={[FLAG_DISC_RADIUS + FLAG_BORDER_WIDTH, 48]}/>
                    <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide}/>
                </mesh>
                {frontTexture && backTexture ? (
                    <>
                        <mesh position={[0, 0, 0.001]}>
                            <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                            <meshBasicMaterial map={frontTexture} toneMapped={false} side={THREE.FrontSide}/>
                        </mesh>
                        <mesh position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]}>
                            <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                            <meshBasicMaterial map={backTexture} toneMapped={false} side={THREE.FrontSide}/>
                        </mesh>
                    </>
                ) : (
                    <mesh position={[0, 0, 0.001]}>
                        <circleGeometry args={[FLAG_DISC_RADIUS, 48]}/>
                        <meshBasicMaterial color={FLAG_PLACEHOLDER_COLOR} side={THREE.DoubleSide}/>
                    </mesh>
                )}
            </group>
        </>
    )
}
