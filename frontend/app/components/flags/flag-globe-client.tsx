'use client'

import dynamic from "next/dynamic"
import React from "react"
import type {Match} from "./flag-globe"

const FlagGlobe = dynamic(() => import("@/app/components/flags/flag-globe"), {ssr: false})

interface FlagGlobeClientProps {
    matches?: Match[]
    interactive?: boolean
}

export default function FlagGlobeClient({matches, interactive}: FlagGlobeClientProps = {}): React.JSX.Element {
    return <FlagGlobe matches={matches} interactive={interactive}/>
}
