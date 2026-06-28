'use client'

import React, { useEffect, useState } from "react"
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react"
import { BUTTON_CLASS } from "@/app/util/css-classes"

// Tracks whether this user has already seen the one-off "+1 chip per power-up
// for the knockouts" notification. Client-side flag so we don't need a DB
// column for what is essentially a single announcement; migration V14 grants
// the chips themselves.
const KNOCKOUT_CHIP_BONUS_SEEN_KEY = "predictaball:knockout-chip-bonus-seen"

function hasSeen(): boolean {
    if (typeof window === "undefined") return true
    try {
        return window.localStorage.getItem(KNOCKOUT_CHIP_BONUS_SEEN_KEY) === "true"
    } catch {
        // Storage disabled (private mode etc): don't pester the user.
        return true
    }
}

function markSeen(): void {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(KNOCKOUT_CHIP_BONUS_SEEN_KEY, "true")
    } catch {
        // No-op: storage unavailable.
    }
}

export default function KnockoutChipBonusModal(): React.JSX.Element | null {
    const { isOpen, onOpen, onClose } = useDisclosure()
    // Render nothing on the server: gating depends on localStorage, and a SSR
    // render with `isOpen=true` would flash the modal before the effect runs.
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (hasSeen()) return
        onOpen()
    }, [onOpen])

    function handleClose() {
        markSeen()
        onClose()
    }

    if (!mounted) return null

    return (
        <Modal isOpen={isOpen} onClose={handleClose} placement="center" backdrop="blur" size="md">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase">Knockouts bonus</span>
                    <h2 className="text-2xl font-black tracking-tight">
                        You&apos;ve got <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">+1 of each chip</span>
                    </h2>
                </ModalHeader>
                <ModalBody>
                    <p className="text-sm text-slate-600 dark:text-gray-300">
                        For the knockout stage we&apos;ve topped up your power-ups: one extra <strong>Double Points</strong>, one extra <strong>Off by One</strong> and one extra <strong>Follow the Crowd</strong>. Spend them wisely.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button onPress={handleClose} className={BUTTON_CLASS} radius="full">
                        Got it
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
