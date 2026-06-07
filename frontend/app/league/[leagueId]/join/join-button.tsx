'use client'

import React, { useState } from "react"
import { Button } from "@nextui-org/react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { LeagueApi } from "@/client"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { BUTTON_CLASS } from "@/app/util/css-classes"

interface JoinButtonProps {
    leagueId: string
}

export default function JoinButton({ leagueId }: JoinButtonProps): React.JSX.Element {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function join() {
        setIsLoading(true)
        try {
            const leagueApi = new LeagueApi(await getConfigWithAuthHeaderClient())
            await leagueApi.joinLeague({ leagueId })
            router.push(`/app/league/${leagueId}/leaderboard`)
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
        </>
    )
}
