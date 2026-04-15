import React from "react"
import {redirect} from "next/navigation"

export default async function SignUpPage({searchParams}: {searchParams: Promise<{leagueId?: string}>}) {
    const {leagueId} = await searchParams
    redirect(leagueId ? `/login?leagueId=${leagueId}` : "/login")
}
