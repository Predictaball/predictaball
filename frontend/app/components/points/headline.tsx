import React from "react";
import CountUpWrapped from "@/app/components/points/count-up-wrapper";
import { GetUserPoints200Response, GetUserPointsRequest, User, UserApi } from "@/client";
import { getConfigWithAuthHeader } from "@/app/api/client-config";
import { getUserId } from "@/app/auth/jtw-handler";
import { getPositionForLeague } from "@/app/app/league/get-position-for-league";

export default async function Headline(): Promise<React.JSX.Element> {

    const userId = getUserId()
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

    return (
        <div className="w-full max-w-screen-lg mx-auto">
            <div className="w-full flex mt-1 max-w-xl items-center text-center justify-around p-2 mx-auto">
                <div className="w-1/5">
                    <div className="flex-row">
                        <div className="font-bold text-white mb-1">Position</div>
                        <div className="text-3xl rounded bg-gray-100 h-14 content-center">
                            {await getPositionForLeague("global", config, userId)}
                        </div>
                    </div>
                </div>
                <div className="w-1/3">
                    <div className="flex-row">
                        <div className="font-bold text-white mb-1">Points</div>
                        <div className="text-5xl rounded bg-gray-100 h-24 content-center"><CountUpWrapped end={(fetchedData?.fixedPoints || 0) + (fetchedData?.livePoints || 0)} /></div>
                    </div>
                </div>
                <div className="w-1/5">
                    <div className="flex-row">
                        <div className="font-bold text-white mb-1">Live</div>
                        <div className="text-3xl rounded bg-gray-100 h-14 content-center">{fetchedData?.livePoints}</div>
                    </div>
                </div>
            </div></div>
    )
}