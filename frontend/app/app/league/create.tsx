'use client'

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
import {AUTH_INPUT_CLASS_NAMES, BUTTON_CLASS, GHOST_BUTTON_CLASS} from "@/app/util/css-classes";
import React, {useState} from "react";
import {LeagueApi} from "@/client";
import {PressEvent} from "@react-types/shared";
import {getConfigWithAuthHeaderClient} from "@/app/api/client-config-client-side";
import { navigateTo } from "@/app/actions";

function TrophyIcon({className}: {className?: string}): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
            <path d="M6 4h12v4a6 6 0 0 1-12 0V4Z"/>
            <path d="M6 6H4a2 2 0 0 0 0 4h2"/>
            <path d="M18 6h2a2 2 0 0 1 0 4h-2"/>
            <path d="M10 14.5V17m4-2.5V17"/>
            <path d="M8 21h8m-7-4h6l.5 4h-7l.5-4Z"/>
        </svg>
    )
}

export default function CreateLeague(): React.JSX.Element {

    const {isOpen, onOpen, onOpenChange} = useDisclosure()

    const [didFail, setDidFail] = useState(false)
    const [leagueName, setLeagueName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function createLeague(): Promise<string | undefined> {
        setIsLoading(true)
        try {
            const leagueApi = new LeagueApi(await getConfigWithAuthHeaderClient())
            const response = await leagueApi.createLeague({
                createLeagueRequest: {
                    leagueName: leagueName
                }
            })
            setDidFail(false)
            setIsLoading(false)
            return response.leagueId 
        } catch (error) {
            setDidFail(true)
            setIsLoading(false)
            return undefined
        }
    }

    function getOnPress(onClose: () => void) {
        return (_: PressEvent) => {
            createLeague().then(leagueId => {
                if (leagueId !== undefined) {
                    navigateTo(`app/league/${leagueId}/leaderboard`)
                    onClose()
                }
            })
        };
    }

    return (
        <div className="w-full justify-around mr-2">
            <Button className={BUTTON_CLASS} onPress={onOpen} style={{width: "100%"}}>
                Create
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
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-cyan-400 to-green-300 p-[1.5px] shadow-2xl shadow-cyan-500/25">
                            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900">
                                {/* ambient brand glow */}
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.08),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.22),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.14),transparent_65%)]"/>

                                <ModalHeader className="relative flex flex-col items-center gap-3 px-6 pt-8 pb-1">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-green-300 shadow-lg shadow-cyan-500/30">
                                        <TrophyIcon className="h-7 w-7 text-white"/>
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Create a League</h2>
                                        <p className="mt-1 text-sm font-normal text-slate-500 dark:text-gray-400">Start your own competition and invite friends to play</p>
                                    </div>
                                </ModalHeader>

                                <ModalBody className="relative px-6 pt-4">
                                    <Input
                                        label="League name"
                                        variant="bordered"
                                        autoFocus
                                        value={leagueName}
                                        classNames={AUTH_INPUT_CLASS_NAMES}
                                        style={{fontSize: "18px"}}
                                        onChange={(event) => {
                                            setDidFail(false)
                                            setLeagueName(event.target.value)
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" && leagueName.trim() !== "" && !isLoading) {
                                                event.preventDefault()
                                                getOnPress(onClose)(undefined as unknown as PressEvent)
                                            }
                                        }}
                                        isDisabled={isLoading}
                                        isInvalid={didFail}
                                        errorMessage={didFail ? "Couldn't create that league — try a different name" : undefined}
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
                                        isDisabled={leagueName.trim() === ""}
                                    >
                                        Create
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