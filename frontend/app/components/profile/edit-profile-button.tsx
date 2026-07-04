'use client'

import React, { useState } from "react"
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { UserApi } from "@/client"
import TeamPicker from "@/app/components/team-picker"
import { AUTH_INPUT_CLASS_NAMES, BUTTON_CLASS, GHOST_BUTTON_CLASS, MODAL_TITLE } from "@/app/util/css-classes"

interface EditProfileButtonProps {
    initialFirstName: string
    initialFamilyName: string
    initialSupportedTeamId: string | null
}

function EditIcon(): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>
        </svg>
    )
}

export default function EditProfileButton({ initialFirstName, initialFamilyName, initialSupportedTeamId }: EditProfileButtonProps): React.JSX.Element {
    const router = useRouter()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [firstName, setFirstName] = useState(initialFirstName)
    const [familyName, setFamilyName] = useState(initialFamilyName)
    const [teamId, setTeamId] = useState<string | null>(initialSupportedTeamId)
    const [isSaving, setIsSaving] = useState(false)

    const trimmedFirst = firstName.trim()
    const trimmedFamily = familyName.trim()
    const nameInvalid = trimmedFirst === "" || trimmedFamily === "" || trimmedFirst.includes("@") || trimmedFamily.includes("@")
    const dirty = trimmedFirst !== initialFirstName || trimmedFamily !== initialFamilyName || teamId !== initialSupportedTeamId
    const saveDisabled = nameInvalid || teamId === null || !dirty

    function reset() {
        setFirstName(initialFirstName)
        setFamilyName(initialFamilyName)
        setTeamId(initialSupportedTeamId)
    }

    function handleClose() {
        reset()
        onClose()
    }

    async function handleSave() {
        setIsSaving(true)
        try {
            const userApi = new UserApi(await getConfigWithAuthHeaderClient())
            await userApi.updateUserProfile({
                updateUserProfileRequest: {
                    firstName: trimmedFirst !== initialFirstName ? trimmedFirst : undefined,
                    familyName: trimmedFamily !== initialFamilyName ? trimmedFamily : undefined,
                    supportedTeamId: teamId !== initialSupportedTeamId ? (teamId ?? undefined) : undefined,
                },
            })
            toast.success("Profile updated")
            onClose()
            router.refresh()
        } catch {
            toast.error("Failed to update profile")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <Button onPress={onOpen} size="sm" radius="full" startContent={<EditIcon/>} className={GHOST_BUTTON_CLASS}>
                Edit
            </Button>
            <Modal isOpen={isOpen} onClose={handleClose} placement="center" backdrop="blur" size="md" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>
                        <h2 className={MODAL_TITLE}>Edit profile</h2>
                    </ModalHeader>
                    <ModalBody className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                type="text"
                                name="given-name"
                                autoComplete="given-name"
                                label="First name"
                                variant="bordered"
                                isInvalid={trimmedFirst === "" || trimmedFirst.includes("@")}
                                classNames={AUTH_INPUT_CLASS_NAMES}
                                style={{ fontSize: "18px" }}
                            />
                            <Input
                                value={familyName}
                                onChange={(e) => setFamilyName(e.target.value)}
                                type="text"
                                name="family-name"
                                autoComplete="family-name"
                                label="Last name"
                                variant="bordered"
                                isInvalid={trimmedFamily === "" || trimmedFamily.includes("@")}
                                classNames={AUTH_INPUT_CLASS_NAMES}
                                style={{ fontSize: "18px" }}
                            />
                        </div>
                        <TeamPicker value={teamId} onSelect={setTeamId} label="Supporting"/>
                    </ModalBody>
                    <ModalFooter>
                        <Button onPress={handleClose} variant="light" radius="full">
                            Cancel
                        </Button>
                        <Button onPress={handleSave} isLoading={isSaving} isDisabled={saveDisabled} className={BUTTON_CLASS} radius="full">
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}
