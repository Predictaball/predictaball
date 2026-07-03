'use client'

import React, { useEffect, useState } from "react"
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react"
import { useRouter, useSearchParams } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { copyToClipboard } from "@/app/util/clipboard"
import { BUTTON_CLASS, GHOST_BUTTON_CLASS } from "@/app/util/css-classes"
import { inviteUrl } from "@/app/util/leagues"
import InviteQRCode from "@/app/components/leaderboard/invite-qr-code"

interface JustCreatedModalProps {
    leagueId: string
    leagueName: string
}

export default function JustCreatedModal({ leagueId, leagueName }: JustCreatedModalProps): React.JSX.Element | null {
    const router = useRouter()
    const searchParams = useSearchParams()
    const shouldOpen = searchParams.get("share") === "1"
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [copied, setCopied] = useState(false)

    const url = inviteUrl(leagueId)

    useEffect(() => {
        if (shouldOpen) onOpen()
    }, [shouldOpen, onOpen])

    function handleClose() {
        onClose()
        // Drop the query param so refresh doesn't re-open the modal.
        const params = new URLSearchParams(searchParams.toString())
        params.delete("share")
        const next = params.toString()
        router.replace(`/app/league/${leagueId}/leaderboard${next ? `?${next}` : ""}`, { scroll: false })
    }

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

    if (!shouldOpen) return null

    return (
        <>
            <Toaster/>
            <Modal isOpen={isOpen} onClose={handleClose} placement="center" backdrop="blur" size="md">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <span className="text-xs font-semibold tracking-[0.3em] text-pitch-700/90 dark:text-pitch-300/90 uppercase">Your league is ready</span>
                        <h2 className="text-2xl font-black tracking-tight">
                            <span className="text-pitch-700 dark:text-pitch-300">{leagueName}</span>
                        </h2>
                    </ModalHeader>
                    <ModalBody className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-gray-300">
                            Share this link with friends to invite them, or let them scan the QR code. If they&apos;re new, they can sign up straight from the link.
                        </p>
                        <div className="flex justify-center py-1">
                            <InviteQRCode leagueId={leagueId}/>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5">
                            <p className="text-xs text-slate-500 dark:text-gray-400 break-all font-mono">{url}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                            You can find this link any time via the <span className="font-semibold text-slate-700 dark:text-gray-200">Invite</span> button at the top.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={handleClose} className={GHOST_BUTTON_CLASS} radius="full">
                            Got it
                        </Button>
                        <Button onPress={copy} className={BUTTON_CLASS} radius="full">
                            {copied ? "Copied!" : "Copy link"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}
