'use client'

import {useEffect} from "react"
import {useRouter} from "next/navigation"

const REFRESH_INTERVAL_MS = 60_000

/**
 * Re-fetches the (server-rendered) standings on an interval so the tables stay
 * live while matches are in play. Only mounted when there is a live match.
 */
export default function StandingsRefresher(): null {
    const router = useRouter()
    useEffect(() => {
        const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS)
        return () => clearInterval(id)
    }, [router])
    return null
}
