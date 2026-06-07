'use client'

import React, { useEffect } from "react"
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react"
import { useRouter, useSearchParams } from "next/navigation"
import { BUTTON_CLASS } from "@/app/util/css-classes"

interface WelcomeModalProps {
    leagueName: string
}

export default function WelcomeModal({ leagueName }: WelcomeModalProps): React.JSX.Element {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isOpen, onOpen, onClose } = useDisclosure()

    useEffect(() => {
        onOpen()
    }, [onOpen])

    function handleClose() {
        onClose()
        // Strip the trigger param so refresh doesn't re-open the modal.
        const params = new URLSearchParams(searchParams.toString())
        params.delete("joinedLeague")
        const next = params.toString()
        router.replace(`/app${next ? `?${next}` : ""}`, { scroll: false })
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} placement="center" backdrop="blur" size="md">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase">You&apos;re in!</span>
                    <h2 className="text-2xl font-black tracking-tight">
                        Welcome to <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">{leagueName}</span>
                    </h2>
                </ModalHeader>
                <ModalBody>
                    <p className="text-sm text-slate-600 dark:text-gray-300">
                        Make your predictions for the upcoming matches below — every score you call earns you points and pushes you up the leaderboard.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button onPress={handleClose} className={BUTTON_CLASS} radius="full">
                        Let&apos;s go
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
