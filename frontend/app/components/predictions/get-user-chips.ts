'use server'

import {UserApi} from "@/client"
import {getConfigWithAuthHeader} from "@/app/api/client-config"
import {getUserId} from "@/app/auth/jwt-handler"

export interface UserChips {
    doublePointsRemaining: number
    oneOutRemaining: number
    crowdRemaining: number
}

export async function getUserChips(): Promise<UserChips> {
    const fallback: UserChips = {doublePointsRemaining: 0, oneOutRemaining: 0, crowdRemaining: 0}
    try {
        const userId = await getUserId()
        if (!userId) return fallback
        const userApi = new UserApi(await getConfigWithAuthHeader())
        const result = await userApi.getUserChips({userId})
        return {
            doublePointsRemaining: result.doublePointsChipsRemaining,
            oneOutRemaining: result.oneOutChipsRemaining,
            crowdRemaining: result.crowdChipsRemaining,
        }
    } catch {
        return fallback
    }
}
