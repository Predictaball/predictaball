'use client'

import React from "react"
import AuthShell from "@/app/components/auth-shell"
import AuthForm from "@/app/components/auth-form"

export default function Login({callbackUrl, leagueId}: {callbackUrl: string | undefined, leagueId: string | undefined}) {
    return (
        <AuthShell title="Welcome to predictaball">
            <AuthForm callbackUrl={callbackUrl} leagueId={leagueId}/>
        </AuthShell>
    )
}
