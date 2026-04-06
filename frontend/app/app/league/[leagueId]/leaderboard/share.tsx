'use client'

import { copyToClipboard } from "@/app/util/clipboard"
import { BUTTON_CLASS } from "@/app/util/css-classes"
import { Button } from "@nextui-org/react"
import toast, { Toaster } from "react-hot-toast"
import React from "react";

export default function Share({leagueId}: { leagueId: string}): React.JSX.Element {
    const shareInvite = () => {
        copyToClipboard(`https://www.predictaball.live/app/league/${leagueId}/join`).then( didCopy => {
            if (didCopy) {
                toast.success("Copied League Invite Link To Clipboard", {duration: 4000})
            } else {
                toast.error("Failed To Copy League Invite Link")
            }
        })
    }

    if (leagueId === "global") return <></>

    return (
        <>
            <Toaster/>
            <Button onPress={shareInvite} className={BUTTON_CLASS}>Share Invite</Button>
        </>
    )
}