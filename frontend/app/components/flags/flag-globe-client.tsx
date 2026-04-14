'use client'

import dynamic from "next/dynamic"
import React from "react"

const FlagGlobe = dynamic(() => import("@/app/components/flags/flag-globe"), {ssr: false})

export default function FlagGlobeClient(): React.JSX.Element {
    return <FlagGlobe/>
}
