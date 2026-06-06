'use client'

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Switch } from "@nextui-org/react"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { GetUserProfile200Response, UserApi } from "@/client"
import { FlagImage } from "@/app/components/predictions/flag-image"
import BackButton from "@/app/components/back-button"
import { SECTION_EYEBROW } from "@/app/util/css-classes"
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

            <div className="relative w-full max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-8">
                <Toaster />

                <header className="relative flex items-center justify-between">
                    <BackButton/>
                    <Link href="/" className="hidden sm:flex items-baseline font-black tracking-tight text-lg absolute left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">predicta</span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </Link>
                    <div className="w-10"/>
                </header>

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
                        <section className="flex flex-col items-center text-center">
                            {profile.supportedTeamFlagCode ? (
                                <FlagImage code={profile.supportedTeamFlagCode} name={profile.supportedTeamName ?? `${profile.firstName} ${profile.familyName}`} size={76}/>
                            ) : (
                                <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 text-2xl font-black text-white shadow-lg shadow-cyan-500/30">
                                    {`${profile.firstName.charAt(0)}${profile.familyName.charAt(0)}`.toUpperCase()}
                                </div>
                            )}
                            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{profile.firstName} {profile.familyName}</h1>
                            {profile.supportedTeamName && (
                                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                                    Supporting <span className="font-semibold text-slate-700 dark:text-gray-200">{profile.supportedTeamName}</span>
                                </p>
                            )}
                        </section>

                        <section className="space-y-3">
                            <h2 className={SECTION_EYEBROW + " px-1"}>Account</h2>
                            <div className="rounded-2xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px]">
                                <div className="rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm divide-y divide-slate-100 dark:divide-white/5">
                                    <div className="flex items-center justify-between gap-4 p-5">
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Email</p>
                                        <p className="text-slate-900 dark:text-white text-right truncate">{profile.email}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 p-5">
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Sign-in</p>
                                        <p className="text-slate-900 dark:text-white capitalize">{profile.authProvider}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h2 className={SECTION_EYEBROW + " px-1"}>Email preferences</h2>
                            <div className="rounded-2xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px]">
                                <div className="rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm p-5">
                                    <div className="flex items-center justify-between gap-4">
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
                        </section>
                    </>
                )}
            </div>
        </main>
    )
}
