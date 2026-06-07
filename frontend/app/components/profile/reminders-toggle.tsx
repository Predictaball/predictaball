'use client'

import React, { useState } from "react"
import { Switch } from "@nextui-org/react"
import toast from "react-hot-toast"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { UserApi } from "@/client"

interface RemindersToggleProps {
    initialEnabled: boolean
}

export default function RemindersToggle({ initialEnabled }: RemindersToggleProps): React.JSX.Element {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [isPending, setIsPending] = useState(false)

    async function toggle(next: boolean) {
        const previous = enabled
        setEnabled(next)
        setIsPending(true)
        try {
            const userApi = new UserApi(await getConfigWithAuthHeaderClient())
            await userApi.updateUserProfile({ updateUserProfileRequest: { emailReminders: next } })
            toast.success(next ? "Reminders enabled" : "Reminders disabled")
        } catch {
            setEnabled(previous)
            toast.error("Failed to update preferences")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Switch
            isSelected={enabled}
            isDisabled={isPending}
            onValueChange={toggle}
            color="success"
            className="shrink-0"
        />
    )
}
