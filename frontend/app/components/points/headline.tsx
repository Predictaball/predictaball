import React from "react";
import CountUpWrapped from "@/app/components/points/count-up-wrapper";
import { GetUserPoints200Response, UserApi } from "@/client";
import { getConfigWithAuthHeader } from "@/app/api/client-config";
import { getUserId } from "@/app/auth/jwt-handler";
import { getPositionForLeague } from "@/app/app/league/get-position-for-league";
import StatCard from "@/app/components/points/stat-card";

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
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Position" value={position ?? "—"} accent="blue" />
            <StatCard label="Points" value={<CountUpWrapped end={total} />} accent="cyan" emphasized />
            <StatCard label="Live" value={live} accent="green" pulse={live > 0} />
        </div>
    )
}
