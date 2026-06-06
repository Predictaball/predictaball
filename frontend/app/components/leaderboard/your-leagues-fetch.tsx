'use client'

import {Configuration, League, UserApi} from "@/client";
import React, {useEffect, useState} from "react";
import LeagueComponent from "@/app/components/leaderboard/league";
import {getConfigWithAuthHeaderClient} from "@/app/api/client-config-client-side";

export default function YourLeaguesFetch({initialLeagues}: {initialLeagues: League[]}): React.JSX.Element {
    // Seed from the server-rendered list so there's no loading flash; we still need a
    // client config to fetch each league's position.
    const [leagues, setLeagues] = useState<League[] | undefined>(initialLeagues.length > 0 ? initialLeagues : undefined)
    const [config, setConfig] = useState<Configuration | undefined>(undefined)

    useEffect(() => {
        try {
            getConfigWithAuthHeaderClient().then(config => {
                setConfig(config)
                if (initialLeagues.length === 0) {
                    const client = new UserApi(config)
                    client.getUserLeagues().then(result => setLeagues(result))
                }
            })
        } catch (error) {
            console.log(error)
            setLeagues([])
        }
    }, [initialLeagues])

    if (leagues === undefined) {
        return (
            <div className="space-y-2.5">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-slate-900/10 dark:bg-white/10 p-[1px]">
                        <div className="h-16 rounded-2xl bg-white dark:bg-gray-900/80 animate-pulse"/>
                    </div>
                ))}
            </div>
        )
    }

    if (leagues.length === 0) {
        return (
            <div className="rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 px-4 py-6 text-center text-sm text-slate-500 dark:text-gray-400">
                You haven&apos;t joined any leagues yet.
            </div>
        )
    }

    return (
        <div className="space-y-2.5">
            {leagues.map(league => (
                <LeagueComponent
                    key={league.leagueId}
                    leagueId={league.leagueId}
                    leagueName={league.name}
                    config={config}
                />
            ))}
        </div>
    )
}
