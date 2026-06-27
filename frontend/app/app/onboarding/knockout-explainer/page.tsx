import React from "react"
import {getConfigWithAuthHeader} from "@/app/api/client-config"
import {ListMatchesFilterTypeEnum, MatchApi, MatchRoundEnum} from "@/client"
import {getUserChips} from "@/app/components/predictions/get-user-chips"
import KnockoutExplainerContent from "@/app/app/onboarding/knockout-explainer/knockout-explainer-content"

export default async function KnockoutExplainerPage({searchParams}: {searchParams: Promise<{next?: string}>}): Promise<React.JSX.Element> {
    const {next} = await searchParams
    const continueHref = next ?? "/app"

    const config = await getConfigWithAuthHeader()
    const matchApi = new MatchApi(config)

    const [upcomingMatches, userChips] = await Promise.all([
        matchApi.listMatches({filterType: ListMatchesFilterTypeEnum.Upcoming}).catch(() => []),
        getUserChips(),
    ])

    // Show a real, interactive prediction card for the soonest knockout fixture
    // the user still needs to predict — mirroring the onboarding first-prediction
    // flow. If there isn't one, the page still renders the rules explainer alone.
    const knockoutMatch = upcomingMatches.find(m => m.round !== MatchRoundEnum.GroupStage && !m.prediction)

    return <KnockoutExplainerContent continueHref={continueHref} match={knockoutMatch} userChips={userChips}/>
}
