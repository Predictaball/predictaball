import {getConfigWithAuthHeader} from "@/app/api/client-config"
import HistoryGroupFilter from "@/app/components/history/history-group-filter"
import HistoryMatchCard from "@/app/components/history/history-match-card"
import {LeaderboardInner, LeagueApi, ListMatchesFilterTypeEnum, Match, MatchApi, Standings, StandingsApi} from "@/client"
import PageHeader from "@/app/components/page-header";
import React from "react";
import {getUserForm} from "@/app/components/leaderboard/get-user-form";
import {FlagImage} from "@/app/components/predictions/flag-image";
import FormBadge from "@/app/components/leaderboard/form-badge";
import {SECTION_EYEBROW} from "@/app/util/css-classes";
import StreakBadges from "@/app/components/points/streak-badges";
import {computeStreakStats} from "@/app/util/streaks";
import {bucketMatchesByGroupLetter, groupMatchesByDay, KNOCKOUT_GROUP} from "@/app/util/group-matches";
import {computePredictedStandings} from "@/app/util/predicted-standings";

export default async function Home({
    params
}: {
    params: Promise<{ userId: string }>
}): Promise<React.JSX.Element> {
    const { userId } = await params

    async function getGames(): Promise<Match[]> {
        try {
            const matchApi = new MatchApi(await getConfigWithAuthHeader())
            const liveMatches: Match[] = await matchApi.listMatches({
                filterType: ListMatchesFilterTypeEnum.Live,
                userId: userId
            })
            const completed: Match[] = await matchApi.listMatches({
                filterType: ListMatchesFilterTypeEnum.Completed,
                userId: userId
            })
            return [
                ...liveMatches,
                ...completed.sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())
            ]
        } catch (error) {
            console.log(error)
            return []
        }
    }

    async function getEntry(): Promise<LeaderboardInner | undefined> {
        try {
            const leaderboardApi = new LeagueApi(await getConfigWithAuthHeader())
            const league = await leaderboardApi.getLeagueLeaderboard({ leagueId: "global", pageSize: "200" })
            return league.leaderboard.find(entry => entry.user.userId === userId)
        } catch (error) {
            console.log(error)
            return undefined
        }
    }

    async function getStandings(): Promise<Standings> {
        try {
            return await new StandingsApi(await getConfigWithAuthHeader()).getStandings()
        } catch (error) {
            console.log(error)
            return {groups: [], thirdPlaced: []}
        }
    }

    const [leaderboardEntry, form, games, standings] = await Promise.all([getEntry(), getUserForm(userId), getGames(), getStandings()])

    const streaks = computeStreakStats(games)
    const matchesByGroup = bucketMatchesByGroupLetter(standings.groups, games)
    const predictedStandingsByGroup = computePredictedStandings(standings.groups, games)
    const actualStandingsByGroup = Object.fromEntries(standings.groups.map(g => [g.group, g.standings]))
    const groupOrder = [
        ...standings.groups.map(g => g.group).filter(group => matchesByGroup[group]?.length),
        ...(matchesByGroup[KNOCKOUT_GROUP]?.length ? [KNOCKOUT_GROUP] : []),
    ]
    const mostRecentMatch = games.reduce<Match | undefined>(
        (latest, m) => !latest || m.datetime.valueOf() > latest.datetime.valueOf() ? m : latest,
        undefined
    )
    const initialGroup = mostRecentMatch
        ? groupOrder.find(group => matchesByGroup[group]?.some(m => m.matchId === mostRecentMatch.matchId))
        : undefined
    const recentDayGroups = groupMatchesByDay(games).slice(0, 2)
    const user = leaderboardEntry?.user
    const fullName = user ? `${user.firstName} ${user.familyName}` : "Player"
    const initials = user ? `${user.firstName.charAt(0)}${user.familyName.charAt(0)}` : "?"
    const totalPoints = user ? user.fixedPoints + user.livePoints : undefined

    return (
        <main className="relative min-h-svh bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-clip">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
                <PageHeader/>

                <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {user?.supportedTeamFlagCode ? (
                            <FlagImage code={user.supportedTeamFlagCode} name={user.supportedTeamName ?? fullName} size={76}/>
                        ) : (
                            <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-300 text-2xl font-black text-white shadow-lg shadow-cyan-500/30">
                                {initials.toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">{fullName}</h1>
                            {user?.supportedTeamName && (
                                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                                    Supporting <span className="font-semibold text-slate-700 dark:text-gray-200">{user.supportedTeamName}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {(leaderboardEntry || form.length > 0) && (
                        <div className="flex w-full flex-col items-start gap-4 sm:w-auto sm:items-end sm:shrink-0">
                            {(leaderboardEntry || form.length > 0) && (
                                <div className="flex w-full items-stretch justify-between gap-3 sm:w-auto sm:justify-start">
                                    {leaderboardEntry && (
                                        <div className="flex items-stretch gap-3">
                                            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm px-5 py-2.5 min-w-[88px] text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Rank</p>
                                                <p className="text-xl font-black tabular-nums text-slate-900 dark:text-white">#{leaderboardEntry.position}</p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm px-5 py-2.5 min-w-[88px] text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Points</p>
                                                <p className="text-xl font-black tabular-nums bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">{totalPoints}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* On mobile the form sits in line with rank & points; on desktop it moves to its own block below */}
                                    {form.length > 0 && (
                                        <div className="flex flex-col items-center justify-center gap-1.5 sm:hidden">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Recent form</p>
                                            <FormBadge form={form} highlightLatest/>
                                        </div>
                                    )}
                                </div>
                            )}

                            {form.length > 0 && (
                                <div className="hidden sm:flex flex-col items-end gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Recent form</p>
                                    <FormBadge form={form} highlightLatest/>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <StreakBadges stats={streaks} />

                {recentDayGroups.length > 0 && (
                    <section className="space-y-4">
                        <h2 className={SECTION_EYEBROW + " text-center"}>Recent matches</h2>
                        <div className="flex flex-col gap-6">
                            {recentDayGroups.map(group => (
                                <div key={group.key} className="flex gap-3 sm:gap-4">
                                    <div className="w-12 shrink-0 pt-3.5 sm:w-16 text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                                            {group.date.toLocaleDateString("en-GB", {weekday: "short"})}
                                        </p>
                                        <p className="text-xl font-black leading-none tabular-nums text-slate-900 dark:text-white">
                                            {group.date.toLocaleDateString("en-GB", {day: "numeric"})}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                                            {group.date.toLocaleDateString("en-GB", {month: "short"})}
                                        </p>
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                                        {group.matches.map(match => (
                                            <HistoryMatchCard match={match} key={match.matchId}/>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-4">
                    <h2 className={SECTION_EYEBROW + " text-center"}>Match history</h2>
                    {games.length > 0 ? (
                        <HistoryGroupFilter
                            matchesByGroup={matchesByGroup}
                            groupOrder={groupOrder}
                            initialGroup={initialGroup}
                            predictedStandingsByGroup={predictedStandingsByGroup}
                            actualStandingsByGroup={actualStandingsByGroup}
                        />
                    ) : (
                        <p className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">No completed matches yet — check back once games have been played.</p>
                    )}
                </section>
            </div>
        </main>
    )
}
