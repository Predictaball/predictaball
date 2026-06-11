'use client'

import { useEffect } from "react"
import { TrackingEventEventEnum } from "@/client"
import { track } from "@/app/util/track"

interface Props {
    fromSignup: boolean
}

export default function TrackPresented({ fromSignup }: Props): null {
    useEffect(() => {
        track(TrackingEventEventEnum.JoinPagePresented, fromSignup)
    }, [fromSignup])
    return null
}
