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
import SectionHeading from "@/app/components/section-heading";
import LeaguesHelp from "@/app/components/leaderboard/leagues-help";
import MatchesHelp from "@/app/components/predictions/matches-help";
import {FlagImage} from "@/app/components/predictions/flag-image";
import {redirect} from "next/navigation";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {GetTournamentState200ResponseStateEnum, League, ListMatchesFilterTypeEnum, MatchApi, TournamentApi, UserApi} from "@/client";
import PredictionPanel from "@/app/components/predictions/prediction-panel";
import PredictNowBanner from "@/app/components/predictions/predict-now-banner";
import {MatchSelectionProvider} from "@/app/components/predictions/match-selection";
import {getUserChips} from "@/app/components/predictions/get-user-chips";

const Home = async () => {
    const config = await getConfigWithAuthHeader()
    const matchApi = new MatchApi(config)
    const userApi = new UserApi(config)
    const tournamentApi = new TournamentApi(config)

    // Members who haven't picked a team yet (e.g. Google sign-ups) must do so first.
    const profile = await userApi.getUserProfile().catch(() => null)
    if (profile && !profile.supportedTeamId) {
        redirect("/app/onboarding")
    }

    const [liveMatches, upcomingMatches, userChips, leagues, tournamentState] = await Promise.all([
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Live}).catch(() => []),
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Upcoming}).catch(() => []),
        getUserChips(),
        userApi.getUserLeagues().catch((): League[] => []),
        tournamentApi.getTournamentState().catch(() => null),
    ])
    const tournamentStarted = tournamentState ? tournamentState.state !== GetTournamentState200ResponseStateEnum.PreTournament : false

    const initials = profile ? `${profile.firstName.charAt(0)}${profile.familyName.charAt(0)}`.toUpperCase() : "?"
    const firstMatchId = (liveMatches[0] ?? upcomingMatches[0])?.matchId

    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative w-full max-w-screen-lg mx-auto px-4 sm:px-6 py-6 space-y-10">
                <Toaster />

                <header className="flex items-center justify-between">
                    <Link href="/" className="flex items-baseline font-black tracking-tight text-lg">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">predicta</span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-[10px] font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle sizeClassName="h-8 w-8" />
                        <AdminButton />
                        <Link href="/app/profile" aria-label="Profile" className="inline-flex items-center gap-2 h-8 rounded-full overflow-hidden bg-slate-900/5 border border-slate-900/10 hover:bg-slate-900/10 hover:border-cyan-500/40 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-cyan-400/40 transition-colors pr-3">
                            {profile?.supportedTeamFlagCode ? (
                                <FlagImage code={profile.supportedTeamFlagCode} name={profile.supportedTeamName ?? "Profile"} size={32}/>
                            ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 text-xs font-black text-white">
                                    {initials}
                                </span>
                            )}
                            <span className="text-xs font-medium text-slate-700 dark:text-gray-200">Profile</span>
                        </Link>
                        <SignOutButton />
                    </div>
                </header>

                <MatchSelectionProvider initialId={firstMatchId}>
                    <PredictNowBanner upcomingMatches={upcomingMatches} />

                    <HeadlineSuspense tournamentStarted={tournamentStarted} nextKickoff={tournamentState?.nextKickoff} />

                    <section id="matches" className="space-y-4">
                        <SectionHeading title="Matches" count={liveMatches.length + upcomingMatches.length} action={<MatchesHelp/>}/>
                    <PredictionPanel liveMatches={liveMatches} upcomingMatches={upcomingMatches} userChips={userChips} />
                </section>

                <section className="flex justify-center">
                    <LinkToHistory />
                </section>

                <section className="space-y-4">
                    <SectionHeading title="Your Leagues" count={leagues.length} action={<LeaguesHelp/>}/>
                    <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-xl shadow-slate-900/5 dark:shadow-cyan-500/5">
                        <div className="rounded-3xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm p-5 sm:p-6">
                            <Dashboard initialLeagues={leagues} />
                        </div>
                    </div>
                </section>

                <section className="space-y-4 pb-10">
                    <SectionHeading
                        title="Global standing"
                        action={
                            <Link href="/app/league/global/leaderboard" className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 transition-colors">
                                View all →
                            </Link>
                        }
                    />
                    <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-xl shadow-slate-900/5 dark:shadow-cyan-500/5">
                        <div className="rounded-3xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm p-5 sm:p-6">
                            <Leaderboard shouldPaginate={false} leagueId={"global"} limit={true} />
                        </div>
                    </div>
                </section>
                </MatchSelectionProvider>
            </div>
        </main>
    );
}

export default Home
