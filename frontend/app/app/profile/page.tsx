'use client'

import React, { useEffect, useState } from "react"
import { Switch } from "@nextui-org/react"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { GetUserProfile200Response, UserApi } from "@/client"
import { FlagImage } from "@/app/components/predictions/flag-image"
import toast, { Toaster } from "react-hot-toast"

export default function ProfilePage() {
    const [profile, setProfile] = useState<GetUserProfile200Response | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            try {
                const userApi = new UserApi(await getConfigWithAuthHeaderClient())
                setProfile(await userApi.getUserProfile())
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    async function toggleReminders(enabled: boolean) {
        const userApi = new UserApi(await getConfigWithAuthHeaderClient())
        try {
            await userApi.updateUserProfile({ updateUserProfileRequest: { emailReminders: enabled } })
            setProfile(prev => prev ? { ...prev, emailReminders: enabled } : null)
            toast.success(enabled ? "Reminders enabled" : "Reminders disabled")
        } catch {
            toast.error("Failed to update preferences")
        }
    }

    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative w-full max-w-lg mx-auto px-4 sm:px-6 py-8">
                <Toaster />
                <h1 className="text-2xl font-black tracking-tight mb-6">Profile</h1>

                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                    </div>
                )}

                {!loading && !profile && (
                    <p className="text-sm text-slate-600 dark:text-gray-300">
                        Couldn&apos;t load your profile. Try refreshing the page.
                    </p>
                )}

                {profile && (
                    <>
                        <div className="rounded-2xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px]">
                            <div className="rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm p-6 space-y-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Name</p>
                                    <p className="text-slate-900 dark:text-white mt-1">{profile.firstName} {profile.familyName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Email</p>
                                    <p className="text-slate-900 dark:text-white mt-1">{profile.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Sign-in method</p>
                                    <p className="text-slate-900 dark:text-white mt-1 capitalize">{profile.authProvider}</p>
                                </div>
                                {profile.supportedTeamName && profile.supportedTeamFlagCode && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Supporting</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FlagImage code={profile.supportedTeamFlagCode} name={profile.supportedTeamName} size={24} />
                                            <p className="text-slate-900 dark:text-white">{profile.supportedTeamName}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h2 className="text-lg font-bold mt-8 mb-4">Email preferences</h2>

                        <div className="rounded-2xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px]">
                            <div className="rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm p-6">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-medium">Prediction reminders</p>
                                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                                            Get an email on match days if you haven&apos;t predicted yet
                                        </p>
                                    </div>
                                    <Switch
                                        isSelected={profile.emailReminders}
                                        onValueChange={toggleReminders}
                                        color="success"
                                        className="shrink-0"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}
