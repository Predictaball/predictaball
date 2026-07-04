import React from "react";
import BackButton from "@/app/components/back-button";
import EmptyState from "@/app/components/empty-state";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {SHARED_DATA_REVALIDATE_SECONDS} from "@/app/api/constants";
import {CountryLeaderboardInner, LeagueApi} from "@/client";
import {PitchPerspective} from "@/app/components/atmosphere";
import CountryRankingEntry from "@/app/components/leaderboard/country-ranking-entry";
import PageShell from "@/app/components/page-shell";
import Wordmark from "@/app/components/wordmark";
import {BRAND_GRADIENT, SECTION_EYEBROW, TEXT_PRIMARY} from "@/app/util/css-classes";

function GlobeIcon({className}: {className?: string}): React.JSX.Element {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
            <circle cx="12" cy="12" r="9"/>
            <path d="M3 12h18"/>
            <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z"/>
        </svg>
    )
}

export default async function CountryRankingsPage(): Promise<React.JSX.Element> {
    const rankings: CountryLeaderboardInner[] = await new LeagueApi(await getConfigWithAuthHeader())
        .getCountryRankings({next: {revalidate: SHARED_DATA_REVALIDATE_SECONDS}})
        .then(response => response.rankings)
        .catch(() => [])

    return (
        <PageShell svh>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-svh"><PitchPerspective/></div>

            <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
                <header className="relative flex items-center justify-between gap-3">
                    <BackButton/>
                    <Wordmark className="hidden sm:flex absolute left-1/2 -translate-x-1/2"/>
                    <div className="w-10"/>
                </header>

                <section className="flex flex-col items-center">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${BRAND_GRADIENT} shadow-lg shadow-cyan-500/30`}>
                            <GlobeIcon className="h-8 w-8 text-white"/>
                        </div>
                        <p className={`mt-3 ${SECTION_EYEBROW}`}>Rankings</p>
                        <h1 className={`mt-1 text-3xl font-black tracking-tight ${TEXT_PRIMARY}`}>
                            Country Rankings
                        </h1>
                        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-gray-400">
                            Countries ranked against one another. A country&apos;s score for each match is the average points of its supporters who predicted that match.
                        </p>
                    </div>

                    <div className="w-full max-w-2xl mx-auto">
                        {rankings.length === 0 ? (
                            <EmptyState contentClassName="px-4 py-8 text-sm text-slate-500 dark:text-gray-400">
                                No country scores yet — check back once matches have been played.
                            </EmptyState>
                        ) : (
                            rankings.map(entry => (
                                <CountryRankingEntry key={entry.teamId} entry={entry}/>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </PageShell>
    );
}
