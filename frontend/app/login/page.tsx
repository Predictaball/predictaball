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

    const loggedIn = await isLoggedIn()
    if (loggedIn) {
        if (leagueId !== undefined) {
            redirect(`app/league/${leagueId}/join`)
        } else {
            redirect("/app")
        }
    }

    return <Login leagueId={leagueId}/>
}

export default ServerLogin