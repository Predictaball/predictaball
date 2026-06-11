'use client'

import React, { useState } from "react"
import { Button } from "@nextui-org/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { LeagueApi, TrackingEventEventEnum } from "@/client"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { BUTTON_CLASS, GHOST_BUTTON_CLASS } from "@/app/util/css-classes"
import { track } from "@/app/util/track"

interface JoinButtonProps {
    leagueId: string
    fromSignup?: boolean
}

export default function JoinButton({ leagueId, fromSignup }: JoinButtonProps): React.JSX.Element {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function join() {
        setIsLoading(true)
        track(TrackingEventEventEnum.JoinClicked, fromSignup ?? false)
        try {
            const leagueApi = new LeagueApi(await getConfigWithAuthHeaderClient())
            await leagueApi.joinLeague({ leagueId })
            if (fromSignup) {
                router.replace(`/app?joinedLeague=${encodeURIComponent(leagueId)}`)
            } else {
                router.replace(`/app/league/${leagueId}/leaderboard`)
            }
        } catch {
            toast.error("Couldn't join the league — try again")
            setIsLoading(false)
        }
    }

    return (
        <>
            <Toaster/>
            <Button
                radius="full"
                onPress={join}
                isLoading={isLoading}
                className={"mt-6 w-full " + BUTTON_CLASS}
            >
                Join league
            </Button>
            <Button
                as={Link}
                href="/app"
                onPress={() => track(TrackingEventEventEnum.MaybeLaterClicked, fromSignup ?? false)}
                radius="full"
                className={"mt-3 w-full " + GHOST_BUTTON_CLASS}
            >
                Maybe later
            </Button>
        </>
    )
}
