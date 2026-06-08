'use client'

import React, { useState } from "react"
import { Button } from "@nextui-org/react"
import toast, { Toaster } from "react-hot-toast"
import { copyToClipboard } from "@/app/util/clipboard"
import { BUTTON_CLASS } from "@/app/util/css-classes"
import { inviteUrl } from "@/app/util/leagues"
import InviteQRCode from "@/app/components/leaderboard/invite-qr-code"

interface InvitePromptProps {
    leagueId: string
    leagueName: string
}

export default function InvitePrompt({ leagueId, leagueName }: InvitePromptProps): React.JSX.Element {
    const [copied, setCopied] = useState(false)
    const url = inviteUrl(leagueId)

    async function copy() {
        const ok = await copyToClipboard(url)
        if (ok) {
            setCopied(true)
            toast.success("Invite link copied")
            setTimeout(() => setCopied(false), 2000)
        } else {
            toast.error("Couldn't copy — copy it manually")
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto mt-6">
            <Toaster/>
            <div className="rounded-3xl bg-gradient-to-br from-blue-500/10 via-cyan-400/10 to-teal-300/10 border border-cyan-500/20 dark:border-cyan-400/20 p-6 text-center">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    You&apos;re the only one in &ldquo;{leagueName}&rdquo;
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
                    Share the invite link or QR code to get the league going. Friends can sign up straight from the link if they&apos;re new.
                </p>
                <div className="mt-4 flex justify-center">
                    <InviteQRCode leagueId={leagueId} size={160}/>
                </div>
                <Button onPress={copy} radius="full" className={"mt-4 " + BUTTON_CLASS}>
                    {copied ? "Copied!" : "Copy invite link"}
                </Button>
            </div>
        </div>
    )
}
