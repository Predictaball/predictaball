'use client'

import React, {useState} from "react";
import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure
} from "@nextui-org/react";
import {AUTH_INPUT_CLASS_NAMES, BRAND_GHOST_BUTTON_CLASS, BRAND_GRADIENT, BUTTON_CLASS, GHOST_BUTTON_CLASS, MODAL_AMBIENT_GLOW} from "@/app/util/css-classes";
import {LeagueApi} from "@/client";
import {PressEvent} from "@react-types/shared";
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side";
import { navigateTo } from "@/app/actions";

function TicketIcon({className}: {className?: string}): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
            <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6V7Z"/>
            <path d="M14 5v2m0 4v2m0 4v2"/>
        </svg>
    )
}

export default function JoinLeague(): React.JSX.Element {

    const {isOpen, onOpen, onOpenChange} = useDisclosure()

    const [didFail, setDidFail] = useState(false)
    const [leagueId, setLeagueId] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function join(): Promise<boolean> {
        setIsLoading(true)
        try {
            const leagueApi = new LeagueApi(await getConfigWithAuthHeaderClient())
            await leagueApi.joinLeague({leagueId: leagueId})
            setDidFail(false)
            setIsLoading(false)
            return true
        } catch (error) {
            setDidFail(true)
            setIsLoading(false)
            return false
        }
    }

    function getOnPress(onClose: () => void) {
        return (_: PressEvent) => {
            join().then(r => {
                if (r) {
                    navigateTo(`app/league/${leagueId}/leaderboard`)
                    onClose()
                }
            })
        };
    }

    return (
        <div className="w-full justify-around ml-2">
            <Button className={BRAND_GHOST_BUTTON_CLASS} style={{width: "100%"}} onPress={onOpen}>
                Join
            </Button>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="center"
                backdrop="blur"
                classNames={{
                    backdrop: "bg-slate-950/50 backdrop-blur-md",
                    base: "bg-transparent shadow-none mx-4",
                    closeButton: "z-20 top-3 right-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10",
                }}
                motionProps={{
                    variants: {
                        enter: {y: 0, opacity: 1, scale: 1, transition: {duration: 0.26, ease: [0.16, 1, 0.3, 1]}},
                        exit: {y: 14, opacity: 0, scale: 0.96, transition: {duration: 0.18, ease: "easeIn"}},
                    },
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${BRAND_GRADIENT} p-[1.5px] shadow-2xl shadow-cyan-500/25`}>
                            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900">
                                {/* ambient brand glow */}
                                <div className={MODAL_AMBIENT_GLOW}/>

                                <ModalHeader className="relative flex flex-col items-center gap-3 px-6 pt-8 pb-1">
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${BRAND_GRADIENT} shadow-lg shadow-cyan-500/30`}>
                                        <TicketIcon className="h-7 w-7 text-white"/>
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Join a League</h2>
                                        <p className="mt-1 text-sm font-normal text-slate-500 dark:text-gray-400">Enter the league ID a friend shared with you</p>
                                    </div>
                                </ModalHeader>

                                <ModalBody className="relative px-6 pt-4">
                                    <Input
                                        label="League ID"
                                        variant="bordered"
                                        autoFocus
                                        value={leagueId}
                                        classNames={AUTH_INPUT_CLASS_NAMES}
                                        style={{fontSize: "18px"}}
                                        onChange={(event) => {
                                            setDidFail(false)
                                            setLeagueId(event.target.value)
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" && leagueId.trim() !== "" && !isLoading) {
                                                event.preventDefault()
                                                getOnPress(onClose)(undefined as unknown as PressEvent)
                                            }
                                        }}
                                        isDisabled={isLoading}
                                        isInvalid={didFail}
                                        errorMessage={didFail ? "Couldn't join that league — check the ID and try again" : undefined}
                                    />
                                </ModalBody>

                                <ModalFooter className="relative flex gap-3 px-6 pb-6 pt-3">
                                    <Button className={GHOST_BUTTON_CLASS + " flex-1"} radius="full" onPress={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        className={BUTTON_CLASS + " flex-1"}
                                        radius="full"
                                        onPress={getOnPress(onClose)}
                                        isLoading={isLoading}
                                        isDisabled={leagueId.trim() === ""}
                                    >
                                        Join
                                    </Button>
                                </ModalFooter>
                            </div>
                        </div>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}