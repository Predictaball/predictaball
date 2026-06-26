import React, { Suspense } from "react";
import WelcomeModal from "@/app/components/onboarding/welcome-modal";
import Link from "next/link";
import Leaderboard from "@/app/components/leaderboard/leaderboard";
import SignOutButton from "@/app/components/sign-out-button";
import Dashboard from "@/app/components/leaderboard/dashboard";
import CountryRankingsPreview from "@/app/components/leaderboard/country-rankings-preview";
import LeaderboardSkeleton from "@/app/components/leaderboard/leaderboard-skeleton";
import HeadlineSuspense from "@/app/components/points/headline-suspense";
import { Toaster } from "react-hot-toast";
import AdminButton from "@/app/components/admin-button";
import ThemeToggle from "@/app/components/theme-toggle";
import SectionHeading from "@/app/components/section-heading";
import Wordmark from "@/app/components/wordmark";
import SurfaceCard from "@/app/components/surface-card";
import {PitchPerspective} from "@/app/components/atmosphere";
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
import {getUserId} from "@/app/auth/jwt-handler";
import {computeStreakStats} from "@/app/util/streaks";

const Home = async ({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) => {
    const resolvedSearchParams = await searchParams
    const joinedLeagueId = typeof resolvedSearchParams.joinedLeague === "string" ? resolvedSearchParams.joinedLeague : undefined

    const config = await getConfigWithAuthHeader()
    const matchApi = new MatchApi(config)
    const userApi = new UserApi(config)
    const tournamentApi = new TournamentApi(config)

    // Members who haven't picked a team yet (e.g. Google sign-ups) must do so first.
    const profile = await userApi.getUserProfile().catch(() => null)
    if (profile && !profile.supportedTeamId) {
        redirect("/app/onboarding")
    }

    const [liveMatches, upcomingMatches, completedMatches, userChips, leagues, tournamentState, userId] = await Promise.all([
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Live}).catch(() => []),
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Upcoming}).catch(() => []),
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Completed}).catch(() => []),
        getUserChips(),
        userApi.getUserLeagues().catch((): League[] => []),
        tournamentApi.getTournamentState().catch(() => null),
        getUserId(),
    ])
    // Show only the few most-recent completed matches in the strip; "View all"
    // links to the full history.
    const recentCompleted = [...completedMatches]
        .sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())
        .slice(0, 3)
    const historyHref = userId ? `/app/user/${userId}/history` : "/app"
    const streaks = computeStreakStats(completedMatches)
    const tournamentStarted = tournamentState ? tournamentState.state !== GetTournamentState200ResponseStateEnum.PreTournament : false

    const initials = profile ? `${profile.firstName.charAt(0)}${profile.familyName.charAt(0)}`.toUpperCase() : "?"
    // Start on a live match if one's in play; otherwise the soonest upcoming
    // match still needing a prediction, then the soonest upcoming.
    const firstUnpredictedUpcoming = upcomingMatches.find(m => !m.prediction)
    const firstMatchId = (liveMatches[0] ?? firstUnpredictedUpcoming ?? upcomingMatches[0])?.matchId

    return (
        <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-clip">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-svh"><PitchPerspective/></div>

            <div className="relative w-full max-w-screen-lg mx-auto px-4 sm:px-6 py-6 space-y-10">
                <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 -mt-6 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-200/60 bg-slate-50/75 backdrop-blur-md dark:border-white/5 dark:bg-gray-900/75">
                    <Wordmark/>
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

                <Toaster />

                <MatchSelectionProvider initialId={firstMatchId}>
                    <PredictNowBanner upcomingMatches={upcomingMatches} />

                    <div className="animate-fade-rise motion-reduce:animate-none">
                        <HeadlineSuspense tournamentStarted={tournamentStarted} nextKickoff={tournamentState?.nextKickoff} hasLiveMatch={liveMatches.length > 0} supportedTeamId={profile?.supportedTeamId} streaks={streaks} />
                    </div>

                    <section id="matches" className="space-y-4 animate-fade-rise animation-delay-75 motion-reduce:animate-none">
                        <SectionHeading
                            title="Matches"
                            count={liveMatches.length + upcomingMatches.length}
                            action={
                                <div className="flex items-center gap-3">
                                    <Link href="/app/standings" className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 transition-colors">
                                        Standings →
                                    </Link>
                                    <MatchesHelp/>
                                </div>
                            }
                        />
                    <PredictionPanel liveMatches={liveMatches} upcomingMatches={upcomingMatches} completedMatches={recentCompleted} historyHref={historyHref} userChips={userChips} streaks={streaks} />
                </section>

                <section className="space-y-4 animate-fade-rise animation-delay-150 motion-reduce:animate-none">
                    <SectionHeading title="Your Leagues" count={leagues.length} action={<LeaguesHelp/>}/>
                    <SurfaceCard>
                        <Dashboard initialLeagues={leagues} />
                    </SurfaceCard>
                </section>

                <section className="space-y-4 animate-fade-rise animation-delay-300 motion-reduce:animate-none">
                    <SectionHeading
                        title="Global standing"
                        action={
                            <Link href="/app/league/global/leaderboard" className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 transition-colors">
                                View all →
                            </Link>
                        }
                    />
                    <SurfaceCard>
                        <Leaderboard shouldPaginate={false} leagueId={"global"} limit={true} />
                    </SurfaceCard>
                </section>

                <section className="space-y-4 pb-10 animate-fade-rise animation-delay-500 motion-reduce:animate-none">
                    <SectionHeading
                        title="Country rankings"
                        action={
                            <Link href="/app/leaderboard/countries" className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 transition-colors">
                                View all →
                            </Link>
                        }
                    />
                    <SurfaceCard>
                        <Suspense fallback={<LeaderboardSkeleton/>}>
                            <CountryRankingsPreview limit={5}/>
                        </Suspense>
                    </SurfaceCard>
                </section>
                </MatchSelectionProvider>
            </div>

            {joinedLeagueId && (() => {
                const joinedLeague = leagues.find(l => l.leagueId === joinedLeagueId)
                return joinedLeague ? (
                    <Suspense>
                        <WelcomeModal leagueName={joinedLeague.name}/>
                    </Suspense>
                ) : null
            })()}
        </main>
    );
}

export default Home
