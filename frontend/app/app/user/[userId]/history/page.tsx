import {getConfigWithAuthHeader} from "@/app/api/client-config"
import {MatchesHeader} from "@/app/components/ticket/matches-header"
import Ticket from "@/app/components/ticket/ticket"
import {LeaderboardInner, LeagueApi, ListMatchesFilterTypeEnum, Match, MatchApi} from "@/client"
import {redirect} from "next/navigation"
import BackButton from "@/app/components/back-button";
import React from "react";
import {isLoggedIn} from "@/app/auth/jtw-handler";
import LeaderboardEntry from "@/app/components/leaderboard/leaderboard-entry";

export default async function Home({
    params
}: {
    params: { userId: string }
}): Promise<React.JSX.Element> {
    const loggedIn = await isLoggedIn()
    if (!loggedIn) redirect("/login")

    async function getGames(): Promise<Match[]> {
        try {
            const matchApi = new MatchApi(await getConfigWithAuthHeader())
            const liveMatches: Match[] = await matchApi.listMatches({
                filterType: ListMatchesFilterTypeEnum.Live,
                userId: params.userId
            })
            const completed: Match[] = await matchApi.listMatches({
                filterType: ListMatchesFilterTypeEnum.Completed,
                userId: params.userId
            })
            return [
                ...liveMatches,
                ...completed.sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())
            ]
        } catch (error) {
            console.log(error)
            return []
        }
    }

    async function getEntry(): Promise<LeaderboardInner | undefined> {
        try {
            const leaderboardApi = new LeagueApi(await getConfigWithAuthHeader())
            const league = await leaderboardApi.getLeagueLeaderboard({ leagueId: "global", pageSize: "200" })
            return league.leaderboard.find(entry => entry.user.userId === params.userId)
        } catch (error) {
            console.log(error)
            return undefined
        }
    }

    const leaderboardEntry = await getEntry()

    return(
        <div className="min-h-svh bg-gray-900">
            <div className="w-full max-w-4xl mx-auto relative">
                <div className="flex justify-between p-4">
                    <div>
                        <BackButton/>
                    </div>
                </div>
                <div className="p-2 w-full bg-gray-900 flex flex-col items-center">
                    {leaderboardEntry !== undefined && <LeaderboardEntry disablePulse entry={leaderboardEntry} isUser={true}/>}
                    {(await getGames()).map((match, index) => {
                    return (
                        <Ticket 
                            match={match} 
                            key={match.matchId} 
                            collapse={true}
                            admin={false}
                            forPredictionPage={false}
                        />
                    )
                })}
                </div>
            </div>
        </div>
    )
}