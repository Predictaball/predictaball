import React from "react";
import Leaderboard from "@/app/components/leaderboard/leaderboard";
import Link from "next/link";
import SignOutButton from "@/app/components/sign-out-button";
import Dashboard from "@/app/components/leaderboard/dashboard";
import HeadlineSuspense from "@/app/components/points/headline-suspense";
import { Toaster } from "react-hot-toast";
import LinkToHistory from "@/app/components/link-to-history"
import AdminButton from "@/app/components/admin-button";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {ListMatchesFilterTypeEnum, MatchApi} from "@/client";
import PredictionPanel from "@/app/components/predictions/prediction-panel";

const Home = async () => {
    const config = await getConfigWithAuthHeader()
    const matchApi = new MatchApi(config)

    const [liveMatches, upcomingMatches] = await Promise.all([
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Live}).catch(() => []),
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Upcoming}).catch(() => []),
    ])

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

                <div className="w-full my-6">
                    <PredictionPanel liveMatches={liveMatches} upcomingMatches={upcomingMatches}/>
                </div>

                <LinkToHistory/>
                <Dashboard />
                <Leaderboard shouldPaginate={false} leagueId={"global"} limit={true} />
            </div>
        </main>
    );
}

export default Home
