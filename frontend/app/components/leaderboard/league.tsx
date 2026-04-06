'use client'

import React, {useEffect, useState} from "react";
import {Link} from "@nextui-org/react";
import {ClickIcon} from "@/app/components/leaderboard/click-icon";
import {getPositionForLeague} from "@/app/app/league/get-position-for-league";
import {Configuration} from "@/client";
import {getUserIdClient} from "@/app/auth/jwt-handler-client";

interface LeagueProps {
    leagueId: string,
    leagueName: string,
    config: Configuration | undefined
}

export default function LeagueComponent(props: LeagueProps): React.JSX.Element {

    const [position, setPosition] = useState(".")

    useEffect(() => {
        if (props.config === undefined) {
            return
        }
        getPositionForLeague(props.leagueId, props.config, getUserIdClient()).then(
            res => setPosition(res.toString())
        )
    })

    return (
        <div key={props.leagueId} className="w-full flex mb-5">
            <Link href={`app/league/${props.leagueId}/leaderboard`} className="w-full">
                <div className="absolute left-3"><ClickIcon/></div>
                <div className="flex w-full justify-around rounded-3xl p-4 text-white"
                     style={{
                         backgroundColor: "#21D4FD",
                         backgroundImage: "linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)"
                     }}>
                    <div className="w-2/3 font-bold">{props.leagueName}</div>
                    <div className="w-1/3">
                        {position}
                    </div>
                </div>
            </Link>
        </div>

    )
}