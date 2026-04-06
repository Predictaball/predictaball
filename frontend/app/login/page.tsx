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

    const loggedIn = await isLoggedIn()
    if (loggedIn) {
        redirect(callbackUrl ?? "/app")
    }

    return <Login callbackUrl={callbackUrl} leagueId={leagueId}/>
}

export default ServerLogin