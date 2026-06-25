'use client'

import React from "react"
import {flagSrc, flagFallbackSrc} from "@/app/util/flag"

interface FlagImgProps {
    code: string
    resolution: string
    alt: string
    className?: string
}

// A flagcdn flag image that falls back to the wsrv.nl proxy once if flagcdn
// drops the request. The onError handler is why this is a client component:
// event handlers can't be passed to DOM elements from a server component, so
// server components (e.g. FlagImage) render this leaf instead of a raw <img>.
export function FlagImg({code, resolution, alt, className}: FlagImgProps): React.JSX.Element {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={flagSrc(code, resolution)}
            alt={alt}
            className={className}
            onError={event => {
                const img = event.currentTarget
                if (img.dataset.fallback) return
                img.dataset.fallback = "1"
                img.src = flagFallbackSrc(code, resolution)
            }}
        />
    )
}
