'use client'

import React from "react"
import AuthShell from "@/app/components/auth-shell"
import AuthForm from "@/app/components/auth-form"

export default function Login({callbackUrl, leagueId, error, email, initialMode}: {callbackUrl: string | undefined, leagueId: string | undefined, error: string | undefined, email: string | undefined, initialMode: string | undefined}) {
    return (
        <AuthShell title="Welcome to predictaball">
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center -mt-2 mb-2">
                    Something went wrong. Please try again.
                </p>
            )}
            <AuthForm callbackUrl={callbackUrl} leagueId={leagueId} initialEmail={email} initialMode={initialMode as "email" | "login" | undefined}/>
        </AuthShell>
    )
}
