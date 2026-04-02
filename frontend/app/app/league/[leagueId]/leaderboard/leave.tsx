'use client'

import React, {useState} from "react";
import {LeagueApi} from "@/client";
import { BUTTON_CLASS } from "@/app/util/css-classes"
import { Button } from "@nextui-org/react"
import toast, { Toaster } from "react-hot-toast"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side";
import { navigateTo } from "@/app/actions";

export default function Leave({leagueId}: { leagueId: string}): React.JSX.Element {
    const [isLoading, setIsLoading] = useState(false)

    async function leaveLeague() {
        setIsLoading(true)
        try {
            const leagueApi = new LeagueApi(await getConfigWithAuthHeaderClient())
            await leagueApi.leaveLeague({leagueId: leagueId})
            setIsLoading(false)
            toast.success("Left league")
            navigateTo(`app/`)
        } catch (error) {
            toast.error("Failed To leave league")
            setIsLoading(false)
        }
    }

    if (leagueId === "global") return <></>

    return (
        <div className="mr-2">
            <Toaster/>
            <Button className="flex-row" onPress={leaveLeague} color="danger" isLoading={isLoading}>Leave League</Button>
        </div>
    )
}