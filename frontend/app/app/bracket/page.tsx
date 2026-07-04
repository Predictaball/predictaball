import React from "react"
import BackButton from "@/app/components/back-button"
import { PitchPerspective } from "@/app/components/atmosphere"
import SectionHeading from "@/app/components/section-heading"
import ScoreHeader from "@/app/components/bracket/score-header"
import BracketTree from "@/app/components/bracket/bracket-tree"
import CupLeaderboardSection from "@/app/components/bracket/cup-leaderboard-section"
import { getBracket, getBracketLeaderboard } from "@/app/api/bracket"
import { getConfigWithAuthHeader } from "@/app/api/client-config"
import { getUserId } from "@/app/auth/jwt-handler"
import { League, UserApi } from "@/client"
import PageShell from "@/app/components/page-shell"
import Wordmark from "@/app/components/wordmark"
import { BRAND_TEXT_GRADIENT, TEXT_PRIMARY } from "@/app/util/css-classes"
import { isGlobalStandingLeague } from "@/app/util/leagues"

export default async function BracketPage({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<React.JSX.Element> {
    const resolved = await searchParams
    const leagueId = typeof resolved.leagueId === "string" ? resolved.leagueId : "global"

    const config = await getConfigWithAuthHeader()
    const [bracket, leaderboard, userLeagues, userId] = await Promise.all([
        getBracket(),
        getBracketLeaderboard(leagueId),
        new UserApi(config).getUserLeagues().catch((): League[] => []),
        getUserId(),
    ])

    // "Global" is surfaced as its own tab; the user's leagues already include the
    // auto-joined standing leagues (global, group-stage, knockout), so drop those
    // to avoid a duplicate Global and the stage-scoped boards the cup doesn't use.
    const cupTabs: Array<{ id: string; name: string }> = [
        { id: "global", name: "Global" },
        ...userLeagues
            .filter((league) => !isGlobalStandingLeague(league.leagueId))
            .map((league) => ({ id: league.leagueId, name: league.name })),
    ]

    return (
        <PageShell svh>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-svh"><PitchPerspective /></div>

            <div className="relative mx-auto w-full max-w-3xl space-y-8 px-4 py-6 sm:px-6">
                <header className="relative flex items-center justify-between gap-3">
                    <BackButton />
                    <Wordmark className="hidden sm:flex absolute left-1/2 -translate-x-1/2"/>
                    <span className="w-9" />
                </header>

                <section className="space-y-2 text-center">
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                        <span className={BRAND_TEXT_GRADIENT}>Knockout Cup</span>
                    </h1>
                    <p className="mx-auto max-w-md text-sm text-slate-600 dark:text-gray-400">
                        A side-game over the knockouts: every team you back to go through scores points that
                        climb each round. Call matches right in a row to build a streak bonus on top.
                        Top of your league lifts the cup.
                    </p>
                    <div className="mx-auto flex max-w-xs justify-center gap-3 pt-1">
                        {[
                            { label: "R32", pts: 1 },
                            { label: "R16", pts: 3 },
                            { label: "QF", pts: 5 },
                            { label: "SF", pts: 8 },
                            { label: "Final", pts: 12 },
                        ].map(({ label, pts }) => (
                            <div key={label} className="flex flex-col items-center gap-0.5">
                                <span className={`text-base font-black tabular-nums ${TEXT_PRIMARY}`}>+{pts}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">{label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-gray-500">
                        🔥 Each correct pick in a row adds a streak bonus: <span className="font-semibold text-slate-500 dark:text-gray-400">+0, +1, +2 … up to +3</span>
                    </p>
                </section>

                {bracket && (
                    <ScoreHeader totalPoints={bracket.totalPoints} currentStreak={bracket.currentStreak} />
                )}

                <section className="space-y-3">
                    <SectionHeading title="Your run" />
                    <p className="text-xs text-slate-400 dark:text-gray-500">
                        Your bracket is automatically filled from your regular match predictions — no extra picks needed.
                    </p>
                    {bracket
                        ? <BracketTree matches={bracket.matches} />
                        : <UnavailableNote />}
                </section>

                <CupLeaderboardSection
                    tabs={cupTabs}
                    initialLeagueId={leagueId}
                    initialRows={leaderboard ? leaderboard.leaderboard : null}
                    currentUserId={userId}
                />
            </div>
        </PageShell>
    )
}

function UnavailableNote(): React.JSX.Element {
    return (
        <div className="rounded-2xl border border-dashed border-slate-900/15 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-gray-400">
            Couldn&apos;t load the Knockout Cup right now. Please try again shortly.
        </div>
    )
}
