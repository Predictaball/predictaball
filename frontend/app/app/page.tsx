import React from "react";
import Leaderboard from "@/app/components/leaderboard/leaderboard";
import MatchesToPredict from "@/app/components/ticket/matches-to-predict";
import Link from "next/link";
import SignOutButton from "@/app/components/sign-out-button";
import Dashboard from "@/app/components/leaderboard/dashboard";
import HeadlineSuspense from "@/app/components/points/headline-suspense";
import { Toaster } from "react-hot-toast";
import LiveMatches from "@/app/components/ticket/live-matches";
import LinkToHistory from "@/app/components/link-to-history"
import AdminButton from "@/app/components/admin-button";

const Home = async () => {
    return (
        <main className="bg-gray-900">
            <div className="w-full max-w-screen-lg mx-auto relative flex min-h-screen flex-col items-center justify-between">
                <Toaster />
                <div className="absolute right-4 top-3">
                    <Link href="/"><SignOutButton /></Link>
                </div>
                <AdminButton />
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
