'use client'

import React, {useState} from "react";
import {LeagueApi} from "@/client";
import { Button } from "@nextui-org/react"
import toast, { Toaster } from "react-hot-toast"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side";
import { navigateTo } from "@/app/actions";
import { isManagedLeague } from "@/app/util/leagues";

const LEAVE_BUTTON_CLASS = "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/20 dark:hover:bg-red-400/20 transition-colors"

function LeaveIcon(): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="m16 17 5-5-5-5"/>
            <path d="M21 12H9"/>
        </svg>
    )
}

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

    if (isManagedLeague(leagueId)) return <></>

    return (
        <>
            <Toaster/>
            <Button size="sm" radius="full" className={LEAVE_BUTTON_CLASS} onPress={leaveLeague} isLoading={isLoading} startContent={isLoading ? null : <LeaveIcon/>}>
                Leave
            </Button>
        </>
    )
}