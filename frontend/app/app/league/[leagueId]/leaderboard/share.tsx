'use client'

import { copyToClipboard } from "@/app/util/clipboard"
import { BRAND_GHOST_BUTTON_CLASS, BUTTON_CLASS, GHOST_BUTTON_CLASS } from "@/app/util/css-classes"
import { Button, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@nextui-org/react"
import toast, { Toaster } from "react-hot-toast"
import React, { useState } from "react";
import { inviteUrl, isManagedLeague } from "@/app/util/leagues";
import { LeagueKindEnum } from "@/client";
import InviteQRCode from "@/app/components/leaderboard/invite-qr-code";

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
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [copied, setCopied] = useState(false)
    const url = inviteUrl(leagueId)

    const copy = () => {
        copyToClipboard(url).then(didCopy => {
            if (didCopy) {
                setCopied(true)
                toast.success("Copied League Invite Link To Clipboard", {duration: 4000})
                setTimeout(() => setCopied(false), 2000)
            } else {
                toast.error("Failed To Copy League Invite Link")
            }
        })
    }

    if (isManagedLeague(kind)) return <></>

    return (
        <>
            <Toaster/>
            <Button onPress={onOpen} size="sm" radius="full" className={BRAND_GHOST_BUTTON_CLASS} startContent={<ShareIcon/>}>
                Invite
            </Button>

            <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur" size="sm">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <span className="text-xs font-semibold tracking-[0.3em] text-pitch-700/90 dark:text-pitch-300/90 uppercase">League invite</span>
                        <h2 className="text-xl font-black tracking-tight">Invite friends to join</h2>
                    </ModalHeader>
                    <ModalBody className="items-center space-y-4 pb-6">
                        <p className="text-center text-sm text-slate-600 dark:text-gray-300">
                            Scan this QR code to join the league, or share the link below.
                        </p>
                        <InviteQRCode leagueId={leagueId}/>
                        <div className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5">
                            <p className="text-xs text-slate-500 dark:text-gray-400 break-all font-mono">{url}</p>
                        </div>
                        <div className="flex w-full gap-2">
                            <Button onPress={onClose} variant="light" radius="full" className={"flex-1 " + GHOST_BUTTON_CLASS}>
                                Close
                            </Button>
                            <Button onPress={copy} radius="full" className={"flex-1 " + BUTTON_CLASS}>
                                {copied ? "Copied!" : "Copy link"}
                            </Button>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    )
}
