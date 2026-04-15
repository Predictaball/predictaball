'use client'

import dynamic from "next/dynamic"
import React from "react"

const FocusedGlobe = dynamic(() => import("@/app/components/flags/focused-globe"), {ssr: false})

interface FocusedGlobeClientProps {
    homeCode: string
    awayCode: string
}

export default function FocusedGlobeClient(props: FocusedGlobeClientProps): React.JSX.Element {
    return <FocusedGlobe {...props}/>
}
