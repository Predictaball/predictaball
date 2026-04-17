import React from "react";
import Link from "next/link";
import Leaderboard from "@/app/components/leaderboard/leaderboard";
import SignOutButton from "@/app/components/sign-out-button";
import Dashboard from "@/app/components/leaderboard/dashboard";
import HeadlineSuspense from "@/app/components/points/headline-suspense";
import { Toaster } from "react-hot-toast";
import LinkToHistory from "@/app/components/link-to-history"
import AdminButton from "@/app/components/admin-button";
import ThemeToggle from "@/app/components/theme-toggle";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {ListMatchesFilterTypeEnum, MatchApi} from "@/client";
import PredictionPanel from "@/app/components/predictions/prediction-panel";
import {SECTION_EYEBROW} from "@/app/util/css-classes";

const Home = async () => {
    const config = await getConfigWithAuthHeader()
    const matchApi = new MatchApi(config)

    const [liveMatches, upcomingMatches] = await Promise.all([
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Live}).catch(() => []),
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Upcoming}).catch(() => []),
    ])

    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative w-full max-w-screen-lg mx-auto px-4 sm:px-6 py-6 space-y-10">
                <Toaster />

                <header className="flex items-center justify-between">
                    <Link href="/" className="flex items-baseline font-black tracking-tight text-lg">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-green-300 bg-clip-text text-transparent">predicta</span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <AdminButton />
                        <SignOutButton />
                    </div>
                </header>

                <HeadlineSuspense />

                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className={SECTION_EYEBROW}>Matches</h2>
                    </div>
                    <PredictionPanel liveMatches={liveMatches} upcomingMatches={upcomingMatches} />
                </section>

                <section className="flex justify-center">
                    <LinkToHistory />
                </section>

                <section className="space-y-4">
                    <h2 className={SECTION_EYEBROW + " px-1"}>Your Leagues</h2>
                    <Dashboard />
                </section>

                <section className="space-y-4 pb-10">
                    <h2 className={SECTION_EYEBROW + " px-1"}>Global Leaderboard</h2>
                    <Leaderboard shouldPaginate={false} leagueId={"global"} limit={true} />
                </section>
            </div>
        </main>
    );
}

export default Home
