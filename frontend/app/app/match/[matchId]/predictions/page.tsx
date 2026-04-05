import React from "react";
import Predictions from "@/app/app/match/[matchId]/predictions/predictions";
import { League, Match, MatchApi, UserApi } from "@/client"
import { getConfigWithAuthHeader } from "@/app/api/client-config"

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

    const leagues: League[] = await getLeagues()
    const match: Match | null = await getMatchData()

    return (
        <>
            {match !== null && <Predictions 
                match={match} 
                leagues={leagues} 
                leagueId={leagueIdAsString} 
                matchId={matchId}
            />}
        </>
    )
}