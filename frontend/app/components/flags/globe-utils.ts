import * as THREE from "three"
import {feature} from "topojson-client"
import type {Topology, GeometryCollection} from "topojson-specification"
import type {Feature, FeatureCollection, MultiPolygon, Polygon, Position} from "geojson"
import landTopo from "world-atlas/land-110m.json"
import countriesTopo from "world-atlas/countries-110m.json"
import ukNations from "./uk-nations.json"

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

// Maps the team country codes we use (ISO 3166-1 alpha-2) to the ISO 3166-1
// numeric ids the world-atlas countries dataset is keyed by. Codes not present
// in the low-res dataset (cw, cv) are intentionally omitted and resolve to no
// fill. The GB home nations (gb-eng, gb-sct) are not here on purpose: the
// world-atlas dataset only has a single United Kingdom feature, so they are
// served their own geometry from uk-nations.json (see UK_NATION_GEOMETRY).
const ALPHA2_TO_ISO_NUM: Record<string, string> = {
    mx: "484", za: "710", kr: "410", cz: "203", ca: "124", ba: "070", qa: "634",
    ch: "756", br: "076", ma: "504", ht: "332", us: "840",
    py: "600", au: "036", tr: "792", de: "276", ci: "384", ec: "218", nl: "528",
    jp: "392", se: "752", tn: "788", be: "056", eg: "818", ir: "364", nz: "554",
    es: "724", sa: "682", uy: "858", fr: "250", sn: "686", iq: "368", no: "578",
    ar: "032", dz: "012", at: "040", jo: "400", pt: "620", cd: "180", uz: "860",
    co: "170", hr: "191", gh: "288", pa: "591",
}

// Per-nation boundaries for the GB home nations, which the world-atlas dataset
// lumps into one United Kingdom feature. Keyed by the codes used elsewhere.
const UK_NATION_GEOMETRY = ukNations as Record<string, Polygon | MultiPolygon>

let countryFeatures: Map<string, Feature<Polygon | MultiPolygon>> | null = null

function getCountryFeatures(): Map<string, Feature<Polygon | MultiPolygon>> {
    if (!countryFeatures) {
        const topo = countriesTopo as unknown as Topology
        const fc = feature(topo, topo.objects.countries as GeometryCollection) as unknown as
            FeatureCollection<Polygon | MultiPolygon>
        countryFeatures = new Map()
        for (const f of fc.features) countryFeatures.set(String(f.id), f)
    }
    return countryFeatures
}

// Tessellate a flat (lng/lat) triangle, projecting each vertex onto the sphere.
// Subdividing keeps the filled surface hugging the globe instead of cutting a
// flat chord through it (which would sink below the surface for large countries).
function emitProjectedTriangle(
    a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2,
    radius: number, depth: number, positions: number[],
) {
    if (depth <= 0) {
        for (const p of [a, b, c]) {
            const v = latLngToVec3(p.y, p.x, radius)
            positions.push(v.x, v.y, v.z)
        }
        return
    }
    const ab = a.clone().add(b).multiplyScalar(0.5)
    const bc = b.clone().add(c).multiplyScalar(0.5)
    const ca = c.clone().add(a).multiplyScalar(0.5)
    emitProjectedTriangle(a, ab, ca, radius, depth - 1, positions)
    emitProjectedTriangle(ab, b, bc, radius, depth - 1, positions)
    emitProjectedTriangle(ca, bc, c, radius, depth - 1, positions)
    emitProjectedTriangle(ab, bc, ca, radius, depth - 1, positions)
}

// Emits the side wall for one ring edge as two triangles spanning from the
// base radius up to the raised top radius.
function emitWallSegment(
    a: THREE.Vector2, b: THREE.Vector2,
    baseRadius: number, topRadius: number, positions: number[],
) {
    const baseA = latLngToVec3(a.y, a.x, baseRadius)
    const baseB = latLngToVec3(b.y, b.x, baseRadius)
    const topA = latLngToVec3(a.y, a.x, topRadius)
    const topB = latLngToVec3(b.y, b.x, topRadius)
    positions.push(baseA.x, baseA.y, baseA.z, baseB.x, baseB.y, baseB.z, topB.x, topB.y, topB.z)
    positions.push(baseA.x, baseA.y, baseA.z, topB.x, topB.y, topB.z, topA.x, topA.y, topA.z)
}

// Builds a filled, slightly extruded geometry for a single country's landmass:
// a triangulated top cap raised `height` above the globe surface, plus side
// walls dropping back down to it. Returns null when the country is not present
// in the dataset.
export function buildCountryFillGeometry(
    code: string, baseRadius: number, height: number,
): THREE.BufferGeometry | null {
    const geometry = UK_NATION_GEOMETRY[code] ?? getCountryFeatures().get(ALPHA2_TO_ISO_NUM[code])?.geometry
    if (!geometry) return null

    const topRadius = baseRadius + height
    const polygons: Position[][][] =
        geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates

    const positions: number[] = []
    for (const polygon of polygons) {
        const rings = polygon.map(ring => {
            const pts = ring.map(p => new THREE.Vector2(p[0], p[1]))
            if (pts.length > 1 && pts[0].equals(pts[pts.length - 1])) pts.pop()
            return pts
        })
        const contour = rings[0]
        if (!contour || contour.length < 3) continue
        const holes = rings.slice(1)

        const faces = THREE.ShapeUtils.triangulateShape(contour, holes)
        const all = [...contour, ...holes.flat()]
        for (const [i, j, k] of faces) {
            emitProjectedTriangle(all[i], all[j], all[k], topRadius, 2, positions)
        }

        for (const ring of rings) {
            for (let i = 0; i < ring.length; i++) {
                emitWallSegment(ring[i], ring[(i + 1) % ring.length], baseRadius, topRadius, positions)
            }
        }
    }

    if (positions.length === 0) return null
    const geom = new THREE.BufferGeometry()
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geom.computeVertexNormals()
    return geom
}

// Whether buildCountryFillGeometry has data to extrude this country. Callers use
// this to know if the country stands proud of the globe, so things resting on it
// (arc endpoints, flag anchors, the stadium) can sit on the raised top instead.
export function hasCountryFill(code: string): boolean {
    if (code in UK_NATION_GEOMETRY) return true
    const iso = ALPHA2_TO_ISO_NUM[code]
    return iso !== undefined && getCountryFeatures().has(iso)
}
