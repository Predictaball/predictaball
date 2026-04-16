'use client'

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {getPositionForLeague} from "@/app/app/league/get-position-for-league";
import {Configuration} from "@/client";
import {getUserIdClient} from "@/app/auth/jwt-handler-client";

interface LeagueProps {
    leagueId: string,
    leagueName: string,
    config: Configuration | undefined
}

export default function LeagueComponent(props: LeagueProps): React.JSX.Element {
    const [position, setPosition] = useState<string>("…")
    const isLoading = props.config === undefined

    useEffect(() => {
        if (props.config === undefined) return
        getPositionForLeague(props.leagueId, props.config, getUserIdClient()).then(
            res => setPosition(res.toString())
        )
    }, [props.leagueId, props.config])

    return (
        <Link href={`app/league/${props.leagueId}/leaderboard`} className="block">
            <div className="group rounded-2xl bg-gradient-to-br from-white/15 to-white/5 p-[1px] transition-transform hover:scale-[1.01]">
                <div className="flex items-center justify-between rounded-2xl bg-gray-900/80 backdrop-blur-sm px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/30 via-cyan-400/30 to-green-300/30 flex items-center justify-center text-sm font-black text-cyan-200">
                            {props.leagueName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="font-semibold text-white truncate">
                            {isLoading ? <span className="inline-block h-4 w-24 bg-white/10 rounded animate-pulse"/> : props.leagueName}
                        </div>
                    </div>
                    <div className="font-black tabular-nums bg-gradient-to-r from-blue-400 via-cyan-300 to-green-300 bg-clip-text text-transparent">
                        {isLoading ? "…" : position}
                    </div>
                </div>
            </div>
        </Link>
    )
}
