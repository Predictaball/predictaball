import { getConfigWithAuthHeader } from "@/app/api/client-config"
import Predictions from "@/app/app/match/[matchId]/predictions/predictions"
import { League, Match, MatchApi, PredictionWithUser, UserApi } from "@/client"
import { getUserId } from "@/app/auth/jwt-handler"
import React from "react"

export default async function Home(
    {
        params,
        searchParams,
    }: {
        params: Promise<{ matchId: string }>
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    }
): Promise<React.JSX.Element> {
    const { matchId } = await params
    const resolvedSearchParams = await searchParams

    const leagueId = resolvedSearchParams["leagueId"]
    const leagueIdAsString: string = leagueId === undefined || Array.isArray(leagueId)
        ? "global"
        : leagueId
    const config = await getConfigWithAuthHeader()

    async function getLeagues(): Promise<League[]> {
        try {
            return await new UserApi(config).getUserLeagues()
        } catch (error) {
            console.log(error)
            return []
        }
    }

    async function getMatchData(): Promise<Match | null> {
        try {
            return await new MatchApi(config).getMatch({ matchId: matchId })
        } catch (error) {
            console.log(error)
            return null
        }
    }

    async function getPredictions(): Promise<PredictionWithUser[]> {
        try {
            const preds = await new MatchApi(config).getMatchPredictions({ matchId, leagueId: leagueIdAsString })
            return preds.sort((a, b) => {
                const pointsComparison = (b.prediction.points ?? 0) - (a.prediction.points ?? 0)
                if (pointsComparison !== 0) return pointsComparison
                const familyNameComparison = a.user.familyName.localeCompare(b.user.familyName)
                if (familyNameComparison !== 0) return familyNameComparison
                return a.user.firstName.localeCompare(b.user.firstName)
            })
        } catch (error) {
            console.log(error)
            return []
        }
    }

    const [leagues, match, predictions, currentUserId] = await Promise.all([
        getLeagues(),
        getMatchData(),
        getPredictions(),
        getUserId(),
    ])

    return (
        <>
            {match !== null && <Predictions
                match={match}
                leagues={leagues}
                leagueId={leagueIdAsString}
                matchId={matchId}
                predictions={predictions}
                currentUserId={currentUserId}
            />}
        </>
    )
}
