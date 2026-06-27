'use server'

import {getConfigWithAuthHeader} from "@/app/api/client-config"
import {Chip, CreatePrediction200Response, PredictionApi, ToGoThrough} from "@/client"

export async function handlePrediction(
    homeScore: number,
    awayScore: number,
    matchId: string,
    chip?: Chip,
    // Knockout matches: which team the user backs to progress. Required when the
    // predicted score is a draw; otherwise derivable from the winning side.
    toGoThrough?: ToGoThrough
): Promise<CreatePrediction200Response | null> {
    const predictionApi = new PredictionApi(await getConfigWithAuthHeader())
    const createPredictionRequest = {
        homeScore: homeScore,
        awayScore: awayScore,
        matchId: matchId,
        chip: chip,
        toGoThrough: toGoThrough
    }

    const result = await predictionApi.createPrediction({
        createPredictionRequest: createPredictionRequest
    })

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/app")

    return result
}