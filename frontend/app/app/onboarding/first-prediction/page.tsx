import React from "react"
import {redirect} from "next/navigation"
import {getConfigWithAuthHeader} from "@/app/api/client-config"
import {ListMatchesFilterTypeEnum, MatchApi} from "@/client"
import {getUserChips} from "@/app/components/predictions/get-user-chips"
import FirstPrediction from "@/app/app/onboarding/first-prediction/first-prediction"

export default async function FirstPredictionPage({searchParams}: {searchParams: Promise<{next?: string}>}): Promise<React.JSX.Element> {
    const {next} = await searchParams
    const destination = next ?? "/app"

    const config = await getConfigWithAuthHeader()
    const matchApi = new MatchApi(config)

    const [upcomingMatches, userChips] = await Promise.all([
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Upcoming}).catch(() => []),
        getUserChips(),
    ])

    // Nothing to predict (e.g. the tournament is over) — skip straight on.
    const match = upcomingMatches[0]
    if (!match) {
        redirect(destination)
    }

    return <FirstPrediction match={match} userChips={userChips} destination={destination}/>
}
