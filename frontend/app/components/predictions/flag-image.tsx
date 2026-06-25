import React from "react"
import {flagSrc, flagFallbackSrc} from "@/app/util/flag"

interface FlagImageProps {
    code: string
    name: string
    size?: number
}

// Swap to the fallback proxy once if flagcdn fails to serve the flag.
function handleFlagError(code: string, resolution: string) {
    return (event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget
        if (img.dataset.fallback) return
        img.dataset.fallback = "1"
        img.src = flagFallbackSrc(code, resolution)
    }
}

export function FlagImage({code, name, size = 48}: FlagImageProps): React.JSX.Element {
    const resolution = size > 40 ? "w160" : "w80"
    const ringWidth = size > 40 ? "ring-2" : "ring-1"
    return (
        <div
            className={`rounded-full ${ringWidth} ring-slate-900/15 dark:ring-white/20 overflow-hidden shrink-0 bg-slate-900/5 dark:bg-white/10`}
            style={{width: size, height: size}}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={flagSrc(code, resolution)}
                alt={name}
                className="h-full w-full object-cover"
                onError={handleFlagError(code, resolution)}
            />
        </div>
    )
}
