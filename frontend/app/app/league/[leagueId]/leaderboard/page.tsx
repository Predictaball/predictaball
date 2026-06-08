import React, { Suspense } from "react";
import Link from "next/link";
import Leaderboard from "@/app/components/leaderboard/leaderboard";
import Share from "./share";
import Leave from "./leave";
import JustCreatedModal from "./just-created-modal";
import InvitePrompt from "./invite-prompt";
import BackButton from "@/app/components/back-button";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {LeagueApi, LeagueKindEnum} from "@/client";


export default async function Home({ params }: { params: Promise<{ leagueId: string }> }): Promise<React.JSX.Element> {
    const { leagueId } = await params

    const league = await new LeagueApi(await getConfigWithAuthHeader())
        .getLeague({ leagueId })
        .catch(() => null)

    const kind: LeagueKindEnum = league?.kind ?? LeagueKindEnum.User
    const showInvitePrompt = league?.kind === LeagueKindEnum.User && league.users.length === 1

    return (
        <main className="relative min-h-dvh bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
                <header className="relative flex items-center justify-between gap-3">
                    <BackButton/>
                    <Link href="/" className="hidden sm:flex items-baseline font-black tracking-tight text-lg absolute left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">predicta</span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Share leagueId={leagueId} kind={kind}/>
                        <Leave leagueId={leagueId} kind={kind}/>
                    </div>
                </header>

                <section className="flex flex-col items-center pb-24">
                    <Leaderboard shouldPaginate={true} leagueId={leagueId} limit={false} />
                    {showInvitePrompt && league && (
                        <InvitePrompt leagueId={leagueId} leagueName={league.name}/>
                    )}
                </section>
            </div>

            {league && league.kind === LeagueKindEnum.User && (
                <Suspense>
                    <JustCreatedModal leagueId={leagueId} leagueName={league.name}/>
                </Suspense>
            )}
        </main>
    );
}
