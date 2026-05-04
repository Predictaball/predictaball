import React from "react";
import { isLoggedIn } from "../auth/jwt-handler";
import { redirect } from "next/navigation";
import Login from "./login";

const ServerLogin = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) => {
    const resolvedSearchParams = await searchParams
    const leagueId = resolvedSearchParams["leagueId"]
    const callbackUrl = resolvedSearchParams["callbackUrl"]
    const error = resolvedSearchParams["error"]
    const email = resolvedSearchParams["email"]
    const initialMode = resolvedSearchParams["mode"]

    const loggedIn = await isLoggedIn()
    if (loggedIn) {
        redirect(callbackUrl ?? "/app")
    }

    return <Login callbackUrl={callbackUrl} leagueId={leagueId} error={error} email={email} initialMode={initialMode}/>
}

export default ServerLogin