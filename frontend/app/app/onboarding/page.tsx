'use client'

import React, { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@nextui-org/react"
import toast, { Toaster } from "react-hot-toast"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { UserApi } from "@/client"
import TeamPicker from "@/app/components/team-picker"
import PageShell from "@/app/components/page-shell"
import { BUTTON_CLASS } from "@/app/util/css-classes"

export default function OnboardingPage() {
    return (
        <Suspense>
            <OnboardingContent/>
        </Suspense>
    )
}

function OnboardingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const next = searchParams.get("next")
    const [supportedTeamId, setSupportedTeamId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function save() {
        if (!supportedTeamId) return
        setIsSaving(true)
        try {
            const userApi = new UserApi(await getConfigWithAuthHeaderClient())
            await userApi.setSupportedTeam({ setSupportedTeamRequest: { teamId: supportedTeamId } })
            const destination = next
                ? `/app/onboarding/how-it-works?next=${encodeURIComponent(next)}`
                : "/app/onboarding/how-it-works"
            router.replace(destination)
        } catch {
            toast.error("Couldn't save your team — try again")
            setIsSaving(false)
        }
    }

    return (
        <PageShell>
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
        </PageShell>
    )
}
