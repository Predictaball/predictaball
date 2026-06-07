'use client'

import { copyToClipboard } from "@/app/util/clipboard"
import { BRAND_GHOST_BUTTON_CLASS } from "@/app/util/css-classes"
import { Button } from "@nextui-org/react"
import toast, { Toaster } from "react-hot-toast"
import React from "react";
import { isManagedLeague } from "@/app/util/leagues";
import { LeagueKindEnum } from "@/client";

function ShareIcon(): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>
        </svg>
    )
}

export default function Share({leagueId, kind}: { leagueId: string; kind: LeagueKindEnum}): React.JSX.Element {
    const shareInvite = () => {
        copyToClipboard(`https://www.predictaball.live/league/${leagueId}/join`).then( didCopy => {
            if (didCopy) {
                toast.success("Copied League Invite Link To Clipboard", {duration: 4000})
            } else {
                toast.error("Failed To Copy League Invite Link")
            }
        })
    }

    if (isManagedLeague(kind)) return <></>

    return (
        <>
            <Toaster/>
            <Button onPress={shareInvite} size="sm" radius="full" className={BRAND_GHOST_BUTTON_CLASS} startContent={<ShareIcon/>}>
                Invite
            </Button>
        </>
    )
}