import {useEffect, useState} from "react"
import * as THREE from "three"
import {flagSrc, flagFallbackSrc} from "../../util/flag"

// Resilient flag-texture loading for the WebGL globes.
//
// react-three-fiber's `useTexture` loads its URLs as one batch and rejects the
// surrounding Suspense boundary if *any single* image fails — so one transient
// flagcdn blip would tear down the whole canvas. That surfaced in Sentry as
// "Could not load https://flagcdn.com/w80/<cc>.png: undefined" (the trailing
// ": undefined" is r3f's `Could not load ${url}: ${err.message}` format, not a
// malformed URL). These helpers load each flag independently, retry the primary
// once, fall back to an independent proxy, and resolve `null` rather than throw
// so a missing flag degrades to a placeholder disc instead of crashing.

const loader = new THREE.TextureLoader()
loader.setCrossOrigin("anonymous")

const RETRY_DELAY_MS = 500
const LOAD_TIMEOUT_MS = 8000
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

// Resolves the loaded texture, rejecting on load error or if the request hangs
// past LOAD_TIMEOUT_MS so a stalled connection can't pin the globe on
// placeholders forever (the image keeps loading; we just stop waiting on it).
function loadOnce(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout: ${url}`)), LOAD_TIMEOUT_MS)
        loader.load(
            url,
            texture => {
                clearTimeout(timer)
                resolve(texture)
            },
            undefined,
            () => {
                clearTimeout(timer)
                reject(new Error(url))
            },
        )
    })
}

async function loadFlagTexture(code: string, resolution: string): Promise<THREE.Texture | null> {
    // flagcdn, a quick retry on flagcdn (transient blip), then the proxy.
    const attempts = [flagSrc(code, resolution), flagSrc(code, resolution), flagFallbackSrc(code, resolution)]
    for (let i = 0; i < attempts.length; i++) {
        if (i > 0) await delay(RETRY_DELAY_MS)
        try {
            return await loadOnce(attempts[i])
        } catch {
            // try the next source
        }
    }
    return null
}

// Loads a flag per code, aligned to the input array; entries are null until
// loaded and stay null if every source fails. `codes` is expected to be a
// stable reference (e.g. a module-level constant).
export function useFlagTextures(codes: string[], resolution: string): (THREE.Texture | null)[] {
    const [textures, setTextures] = useState<(THREE.Texture | null)[]>(() => codes.map(() => null))
    useEffect(() => {
        let active = true
        Promise.all(codes.map(code => loadFlagTexture(code, resolution))).then(result => {
            if (active) setTextures(result)
        })
        return () => {
            active = false
        }
    }, [codes, resolution])
    return textures
}

export function useFlagTexture(code: string, resolution: string): THREE.Texture | null {
    const [texture, setTexture] = useState<THREE.Texture | null>(null)
    useEffect(() => {
        let active = true
        loadFlagTexture(code, resolution).then(result => {
            if (active) setTexture(result)
        })
        return () => {
            active = false
        }
    }, [code, resolution])
    return texture
}
