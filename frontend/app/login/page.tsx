import React from "react";
import { isLoggedIn } from "../auth/jtw-handler";
import { redirect } from "next/navigation";
import Login from "./login";

const ServerLogin = async ({
  params,
  searchParams,
}: {
  params: { }
  searchParams: { [key: string]: string | undefined }
}) => {
    const leagueId = searchParams["leagueId"]

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