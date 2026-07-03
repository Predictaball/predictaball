import React, { Suspense } from "react";
import Link from "next/link";
import Leaderboard from "@/app/components/leaderboard/leaderboard";
import StageTabs from "@/app/components/leaderboard/stage-tabs";
import Share from "./share";
import Leave from "./leave";
import JustCreatedModal from "./just-created-modal";
import InvitePrompt from "./invite-prompt";
import BackButton from "@/app/components/back-button";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {GetLeagueLeaderboardStageEnum, LeagueApi, LeagueKindEnum} from "@/client";
import {PitchPerspective} from "@/app/components/atmosphere";
import {supportsStageFilter} from "@/app/util/leagues";

function parseStage(stageParam: string | string[] | undefined): GetLeagueLeaderboardStageEnum {
    const value = typeof stageParam === "string" ? stageParam : undefined
    return Object.values(GetLeagueLeaderboardStageEnum).find(stage => stage === value)
        ?? GetLeagueLeaderboardStageEnum.All
}

export default async function Home(
    { params, searchParams }: { params: Promise<{ leagueId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<React.JSX.Element> {
    const { leagueId } = await params
    // The global, group-stage and knockout leagues don't offer stage filtering,
    // so ignore any ?stage= param and always show the full leaderboard there.
    const stageFilterEnabled = supportsStageFilter(leagueId)
    const stage = stageFilterEnabled
        ? parseStage((await searchParams)["stage"])
        : GetLeagueLeaderboardStageEnum.All

    const league = await new LeagueApi(await getConfigWithAuthHeader())
        .getLeague({ leagueId })
        .catch(() => null)

    const kind: LeagueKindEnum = league?.kind ?? LeagueKindEnum.User
    const showInvitePrompt = league?.kind === LeagueKindEnum.User && league.users.length === 1

    return (
        <main className="relative min-h-svh bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-svh"><PitchPerspective/></div>

            <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
                <header className="relative flex items-center justify-between gap-3">
                    <BackButton/>
                    <Link href="/" className="hidden sm:flex items-baseline font-black tracking-tight text-lg absolute left-1/2 -translate-x-1/2">
                        <span className="text-pitch-700 dark:text-pitch-300">predicta</span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Share leagueId={leagueId} kind={kind}/>
                        <Leave leagueId={leagueId} kind={kind}/>
                    </div>
                </header>

                <section className="flex flex-col items-center space-y-5">
                    <Leaderboard
                        shouldPaginate={true}
                        leagueId={leagueId}
                        limit={false}
                        stage={stage}
                        stageTabs={stageFilterEnabled ? <StageTabs leagueId={leagueId} activeStage={stage} /> : undefined}
                    />
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
