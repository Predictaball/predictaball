'use server'

import {getConfigWithAuthHeader} from "@/app/api/client-config"
import {CompleteMatchRequest, MatchApi, SetMatchScoreRequest} from "@/client"

export async function submitScore(
    homeScore: number,
    awayScore: number,
    matchId: string
): Promise<void> {
    const matchApi = new MatchApi(await getConfigWithAuthHeader())
    const setMatchScoreRequest: SetMatchScoreRequest = {
        homeScore: homeScore,
        awayScore: awayScore,
    }

    return matchApi.setMatchScore({
        matchId: matchId,
        setMatchScoreRequest: setMatchScoreRequest
    })
}

export async function endMatch(
    homeScore: number,
    awayScore: number,
    matchId: string
): Promise<void> {
    const matchApi = new MatchApi(await getConfigWithAuthHeader())
    const completeMatchRequest: CompleteMatchRequest = {
        homeScore: homeScore,
        awayScore: awayScore,
    }

    return await matchApi.completeMatch({
        matchId: matchId,
        completeMatchRequest: completeMatchRequest
    })
}