import React from "react";
import {isLoggedIn} from "@/app/auth/jtw-handler";
import {redirect} from "next/navigation";

export default async function Home(): Promise<React.JSX.Element> {
    const loggedIn = await isLoggedIn()
    if (!loggedIn) redirect("/login")

    redirect("/app/league/global/leaderboard")
}
