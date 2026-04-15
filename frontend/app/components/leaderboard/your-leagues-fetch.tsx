'use client'

import {Configuration, League, UserApi} from "@/client";
import React, {useEffect, useState} from "react";
import LeagueComponent from "@/app/components/leaderboard/league";
import {getConfigWithAuthHeaderClient} from "@/app/api/client-config-client-side";

export default function YourLeaguesFetch(): React.JSX.Element {
    const [leagues, setLeagues] = useState<League[] | undefined>(undefined)
    const [config, setConfig] = useState<Configuration | undefined>(undefined)

    useEffect(() => {
        try {
            getConfigWithAuthHeaderClient().then(config => {
                setConfig(config)
                const client = new UserApi(config)
                client.getUserLeagues().then(result => setLeagues(result))
            })
        } catch (error) {
            console.log(error)
            setLeagues([])
        }
    }, [])

    if (leagues === undefined) {
        return (
            <div className="space-y-2.5">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/10 p-[1px]">
                        <div className="h-16 rounded-2xl bg-gray-900/80 animate-pulse"/>
                    </div>
                ))}
            </div>
        )
    }

    if (leagues.length === 0) {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-6 text-center text-sm text-gray-400">
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
