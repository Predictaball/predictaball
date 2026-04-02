import React from "react";
import Leaderboard from "@/app/components/leaderboard/leaderboard";
import MatchesToPredict from "@/app/components/ticket/matches-to-predict";
import Link from "next/link";
import SignOutButton from "@/app/components/sign-out-button";
import Dashboard from "@/app/components/leaderboard/dashboard";
import { getUserId, isAdmin, isLoggedIn } from "../auth/jtw-handler";
import { redirect } from "next/navigation";
import { Button } from "@nextui-org/react";
import { BUTTON_CLASS } from "../util/css-classes";
import HeadlineSuspense from "@/app/components/points/headline-suspense";
import { Toaster } from "react-hot-toast";
import LiveMatches from "@/app/components/ticket/live-matches";
import LinkToHistory from "@/app/components/link-to-history"


const Home = async () => {
    const loggedIn = await isLoggedIn()
    if (!loggedIn) redirect("/login")
        
    const isUserAdmin = await isAdmin()

    return (
        <main className="bg-gray-900">
            <div className="w-full max-w-screen-lg mx-auto relative flex min-h-screen flex-col items-center justify-between">
                <Toaster />
                <div className="absolute right-4 top-3">
                    <Link href="/"><SignOutButton /></Link>
                </div>
                {isUserAdmin && <div className="absolute left-4 top-3">
                    <Link href="/app/admin"><Button size="sm" className={BUTTON_CLASS}>Admin</Button></Link>
                </div>}
                <p className="text-xl font-bold mt-4 text-white text-center">PREDICTABALL</p>
                <HeadlineSuspense />
                <LiveMatches admin={false} />
                <MatchesToPredict />
                <LinkToHistory/>
                <Dashboard />
                <Leaderboard shouldPaginate={false} leagueId={"global"} limit={true} />
            </div>
        </main>
    );
}

export default Home
