'use client'

import dynamic from "next/dynamic"
import React from "react"
import type {GroupMatch} from "@/app/components/flags/group-venue-globe"

const GroupVenueGlobe = dynamic(() => import("@/app/components/flags/group-venue-globe"), {ssr: false})

export default function GroupVenueGlobeClient({matches}: {matches: GroupMatch[]}): React.JSX.Element {
    return <GroupVenueGlobe matches={matches}/>
}
