'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@nextui-org/react"
import toast, { Toaster } from "react-hot-toast"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { UserApi } from "@/client"
import TeamPicker from "@/app/components/team-picker"
import { BUTTON_CLASS } from "@/app/util/css-classes"

export default function OnboardingPage() {
    const router = useRouter()
    const [supportedTeamId, setSupportedTeamId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function save() {
        if (!supportedTeamId) return
        setIsSaving(true)
        try {
            const userApi = new UserApi(await getConfigWithAuthHeaderClient())
            await userApi.setSupportedTeam({ setSupportedTeamRequest: { teamId: supportedTeamId } })
            router.replace("/app/onboarding/how-it-works")
        } catch {
            toast.error("Couldn't save your team — try again")
            setIsSaving(false)
        }
    }

    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative w-full max-w-md mx-auto px-4 sm:px-6 py-16">
                <Toaster />
                <h1 className="text-2xl font-black tracking-tight mb-2">One last thing</h1>
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-8">
                    Pick the team you&apos;re supporting. We&apos;ll add you to their league — you can&apos;t change this later.
                </p>

                <div className="space-y-5">
                    <TeamPicker value={supportedTeamId} onSelect={setSupportedTeamId} />
                    <Button
                        onPress={save}
                        isLoading={isSaving}
                        isDisabled={supportedTeamId === null}
                        className={"w-full " + BUTTON_CLASS}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </main>
    )
}
