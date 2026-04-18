import React from "react";
import CountUpWrapped from "@/app/components/points/count-up-wrapper";
import { GetUserPoints200Response, UserApi } from "@/client";
import { getConfigWithAuthHeader } from "@/app/api/client-config";
import { getUserId } from "@/app/auth/jwt-handler";
import { getPositionForLeague } from "@/app/app/league/get-position-for-league";

export default async function Headline(): Promise<React.JSX.Element> {

    const userId = await getUserId()
    const config = await getConfigWithAuthHeader()

    async function fetchUserData(): Promise<GetUserPoints200Response | undefined> {
        if (userId === undefined) {
            return undefined
        }
        try {
            const userApi = new UserApi(config)
            return await userApi.getUserPoints({ userId: userId })
        } catch (error) {
            console.log(error)
            return undefined
        }
    }

    const fetchedData = await fetchUserData()
    const position = await getPositionForLeague("global", config, userId)
    const total = (fetchedData?.fixedPoints || 0) + (fetchedData?.livePoints || 0)
    const live = fetchedData?.livePoints ?? 0

    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-2xl shadow-cyan-500/10">
            <div className="rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-sm px-6 py-7 sm:py-10 text-center">
                <div className="text-5xl sm:text-7xl font-black leading-none tracking-tight">
                    <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-green-300 bg-clip-text text-transparent">
                        <CountUpWrapped end={total} />
                    </span>
                </div>
                <div className="mt-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400">points</div>
                <div className="mt-5 flex items-center justify-center gap-3 flex-wrap text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 px-3.5 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400"/>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">#{position ?? "—"}</span>
                        <span className="text-slate-500 dark:text-gray-400 text-[11px] uppercase tracking-[0.15em]">global</span>
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 px-3.5 py-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full bg-green-400 ${live > 0 ? "animate-pulse" : ""}`}/>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">{live}</span>
                        <span className="text-slate-500 dark:text-gray-400 text-[11px] uppercase tracking-[0.15em]">live</span>
                    </span>
                </div>
            </div>
        </div>
    )
}
