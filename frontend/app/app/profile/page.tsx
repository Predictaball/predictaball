'use client'

import React, { useEffect, useState } from "react"
import { Switch } from "@nextui-org/react"
import { getConfigWithAuthHeaderClient } from "@/app/api/client-config-client-side"
import { API_GATEWAY } from "@/app/api/constants"
import { Configuration } from "@/client"
import toast, { Toaster } from "react-hot-toast"

interface Profile {
    firstName: string
    familyName: string
    email: string
    authProvider: string
    emailReminders: boolean
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getConfigWithAuthHeaderClient().then(config => {
            fetchProfile(config)
        })
    }, [])

    async function fetchProfile(config: Configuration) {
        try {
            const res = await fetch(`${API_GATEWAY}/user/profile`, {
                headers: { Authorization: config.headers?.["Authorization"] ?? "" },
            })
            if (res.ok) setProfile(await res.json())
        } finally {
            setLoading(false)
        }
    }

    async function toggleReminders(enabled: boolean) {
        const config = await getConfigWithAuthHeaderClient()
        const res = await fetch(`${API_GATEWAY}/user/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: config.headers?.["Authorization"] ?? "",
            },
            body: JSON.stringify({ emailReminders: enabled }),
        })
        if (res.ok) {
            setProfile(prev => prev ? { ...prev, emailReminders: enabled } : null)
            toast.success(enabled ? "Reminders enabled" : "Reminders disabled")
        } else {
            toast.error("Failed to update preferences")
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            </div>
        )
    }

    if (!profile) return null

    return (
        <>
            <Toaster />
            <div className="w-full max-w-lg mx-auto px-4 py-8">
                <h1 className="text-2xl font-black tracking-tight mb-6">Profile</h1>

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
                    </div>
                </div>

                <h2 className="text-lg font-bold mt-8 mb-4">Email preferences</h2>

                <div className="rounded-2xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px]">
                    <div className="rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between">
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
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
