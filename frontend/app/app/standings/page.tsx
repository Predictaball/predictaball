import { getBracket } from "@/app/api/bracket"
import { getConfigWithAuthHeader } from "@/app/api/client-config"
import { PitchPerspective } from "@/app/components/atmosphere"
import BracketTree from "@/app/components/bracket/bracket-tree"
import EmptyState from "@/app/components/empty-state"
import type { GroupMatch } from "@/app/components/flags/group-venue-map"
import PageHeader from "@/app/components/page-header"
import StandingsGroups from "@/app/components/standings/standings-groups"
import StandingsRefresher from "@/app/components/standings/standings-refresher"
import ThirdPlacedTable from "@/app/components/standings/third-placed-table"
import PageShell from "@/app/components/page-shell"
import { BRAND_GRADIENT, SECTION_EYEBROW, TEXT_PRIMARY } from "@/app/util/css-classes"
import { buildTeamGroupMap } from "@/app/util/group-matches"
import { ListMatchesFilterTypeEnum, Match, MatchApi, MatchRoundEnum, Standings, StandingsApi } from "@/client"
import React from "react"

export const dynamic = "force-dynamic"

// Returns the group-stage fixtures bucketed by group.
function bucketMatchesByGroup(groups: Standings["groups"], matches: Match[]): Record<string, GroupMatch[]> {
    const teamGroup = buildTeamGroupMap(groups)

    const seen = new Set<string>()
    const byGroup: Record<string, GroupMatch[]> = {}
    for (const m of matches) {
        if (m.round !== MatchRoundEnum.GroupStage || seen.has(m.matchId)) continue
        const group = teamGroup.get(m.homeTeam.toLowerCase()) ?? teamGroup.get(m.awayTeam.toLowerCase())
        if (!group) continue
        seen.add(m.matchId)
        ;(byGroup[group] ??= []).push({
            matchId: m.matchId,
            homeTeam: m.homeTeam,
            homeFlagCode: m.homeTeamFlagCode,
            awayTeam: m.awayTeam,
            awayFlagCode: m.awayTeamFlagCode,
            venue: m.venue,
            datetime: m.datetime,
            state: m.state,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
        })
    }
    for (const group of Object.values(byGroup)) group.sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
    return byGroup
}

function TableIcon({className}: {className?: string}): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <path d="M3 9h18M3 14h18M9 4v16"/>
        </svg>
    )
}

export default async function StandingsPage(
    {searchParams}: {searchParams: Promise<{[key: string]: string | string[] | undefined}>}
): Promise<React.JSX.Element> {
    const resolvedSearchParams = await searchParams
    const groupParam = resolvedSearchParams["group"]
    const initialGroup = typeof groupParam === "string" ? groupParam : undefined
    const config = await getConfigWithAuthHeader()
    const matchApi = new MatchApi(config)
    const [standings, liveMatches, upcomingMatches, completedMatches, bracket] = await Promise.all([
        new StandingsApi(config).getStandings().catch((): Standings => ({groups: [], thirdPlaced: []})),
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Live}).catch((): Match[] => []),
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Upcoming}).catch((): Match[] => []),
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Completed}).catch((): Match[] => []),
        getBracket(),
    ])
    const hasLiveMatch = liveMatches.length > 0
    const matchesByGroup = bucketMatchesByGroup(standings.groups, [...liveMatches, ...upcomingMatches, ...completedMatches])
    // The bracket endpoint carries the user's picks too, but the standings page
    // shows the tournament as it really stands, so BracketTree renders it in
    // results-only mode. Hidden until the knockouts actually have fixtures.
    const knockoutMatches = bracket?.matches ?? []

    return (
        <PageShell svh>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-svh"><PitchPerspective/></div>

            {hasLiveMatch && <StandingsRefresher/>}

            <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <PageHeader/>

                {knockoutMatches.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex flex-col items-center text-center">
                            <p className={SECTION_EYEBROW}>Knockouts</p>
                            <h2 className={`mt-0.5 text-2xl font-black tracking-tight ${TEXT_PRIMARY}`}>Bracket</h2>
                            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-gray-400">
                                The road to the final, filled in as results come in.
                            </p>
                        </div>
                        <BracketTree matches={knockoutMatches} resultsOnly/>
                    </section>
                )}

                <div className="flex flex-col items-center text-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${BRAND_GRADIENT} shadow-lg shadow-cyan-500/30`}>
                        <TableIcon className="h-6 w-6 text-white"/>
                    </div>
                    <p className={`mt-2 ${SECTION_EYEBROW}`}>Group Stage</p>
                    <h1 className={`mt-0.5 text-3xl font-black tracking-tight ${TEXT_PRIMARY}`}>Standings</h1>
                    <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-gray-400">
                        Live group tables, updated as scores come in.
                        {hasLiveMatch && (
                            <span className="ml-1 inline-flex items-center gap-1 font-semibold text-rose-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"/>
                                Live
                            </span>
                        )}
                    </p>
                </div>

                {standings.groups.length === 0 ? (
                    <EmptyState className="mx-auto max-w-md" contentClassName="px-4 py-8 text-sm text-slate-500 dark:text-gray-400">
                        Standings will appear here once the group stage gets under way.
                    </EmptyState>
                ) : (
                    <>
                        <StandingsGroups groups={standings.groups} matchesByGroup={matchesByGroup} initialGroup={initialGroup}/>

                        <section className="space-y-4">
                            <div className="flex flex-col items-center text-center">
                                <h2 className={`text-2xl font-black tracking-tight ${TEXT_PRIMARY}`}>Third-placed teams</h2>
                                <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-gray-400">
                                    Ranked across all groups — the eight best third-placed teams join the round of 32.
                                </p>
                            </div>
                            <div className="mx-auto max-w-2xl">
                                <ThirdPlacedTable rows={standings.thirdPlaced}/>
                            </div>
                        </section>
                    </>
                )}

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-8 text-xs text-slate-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Qualifies</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"/>Best-third contention</span>
                </div>
            </div>
        </PageShell>
    )
}
