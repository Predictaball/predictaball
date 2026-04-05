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
import Ticket from "@/app/components/ticket/ticket";
import {MatchesHeader} from "@/app/components/ticket/matches-header";

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

                {liveMatches.length > 0 && <div className="flex flex-wrap w-full content-center justify-center">
                    <MatchesHeader showInfoButton={false} title="Live Matches" />
                    {liveMatches.map((match, i) => (
                        <Ticket match={match} key={match.matchId} collapse={i !== 0} admin={false} forPredictionPage={false} />
                    ))}
                </div>}

                {upcomingMatches.length > 0 && <div className="flex flex-wrap w-full content-center justify-center">
                    <MatchesHeader showInfoButton title="Upcoming Matches" extraInfo="Predict the score when the match ends, including any extra time." />
                    {upcomingMatches.map((match, i) => (
                        <Ticket match={match} key={match.matchId} collapse={i !== 0} admin={false} forPredictionPage={false} />
                    ))}
                </div>}

                <LinkToHistory/>
                <Dashboard />
                <Leaderboard shouldPaginate={false} leagueId={"global"} limit={true} />
            </div>
        </main>
    );
}

export default Home
