import * as THREE from "three"
import {feature} from "topojson-client"
import type {Topology, GeometryCollection} from "topojson-specification"
import type {Feature, FeatureCollection, MultiPolygon, Polygon, Position} from "geojson"
import landTopo from "world-atlas/land-110m.json"

export const GLOBE_RADIUS = 1.5

export function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * Math.PI / 180
    const theta = (lng + 180) * Math.PI / 180
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    )
}

export function orientationForPosition(pos: THREE.Vector3): THREE.Euler {
    const normal = pos.clone().normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    return new THREE.Euler().setFromQuaternion(quaternion)
}

export function cropSquare(source: THREE.Texture): THREE.Texture {
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

export function buildContinentGeometry(radius: number): THREE.BufferGeometry {
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
