'use client'

import {Configuration, League, UserApi} from "@/client";
import React, {useEffect, useState} from "react";
import LeagueComponent from "@/app/components/leaderboard/league";
import {getConfigWithAuthHeaderClient} from "@/app/api/client-config-client-side";

export default function YourLeaguesFetch(): React.JSX.Element {

    const [leagues, setLeagues] = useState<League[]>([])
    const [config, setConfig] = useState<Configuration | undefined>(undefined)

    useEffect(() => {
            try {
                getConfigWithAuthHeaderClient().then(
                    config => {
                        setConfig(config)
                        const client = new UserApi(config)
                        client.getUserLeagues().then(
                            result => setLeagues(result)
                        )
                    }
                )
            } catch (error) {
                console.log(error)
                setLeagues([])
            }
        }, []
    )

    return (
        <>
            {leagues.length === 0
                ? <LeagueComponent leagueId={"loading"} leagueName={"loading"} config={undefined}/>
                : leagues.map(league => {
                        return <LeagueComponent
                            key={league.leagueId}
                            leagueId={league.leagueId}
                            leagueName={league.name}
                            config={config}
                        />
                    }
                )}
        </>
    )

}