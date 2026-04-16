import React from "react"

interface FlagImageProps {
    code: string
    name: string
    size?: number
}

export function FlagImage({code, name, size = 48}: FlagImageProps): React.JSX.Element {
    const resolution = size > 40 ? "w160" : "w80"
    const ringWidth = size > 40 ? "ring-2" : "ring-1"
    return (
        <div
            className={`rounded-full ${ringWidth} ring-white/20 overflow-hidden shrink-0 bg-white/10`}
            style={{width: size, height: size}}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://flagcdn.com/${resolution}/${code}.png`} alt={name} className="h-full w-full object-cover"/>
        </div>
    )
}
