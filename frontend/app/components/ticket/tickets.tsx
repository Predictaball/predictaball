import Ticket from "@/app/components/ticket/ticket";
import React from "react";
import {ListMatchesFilterTypeEnum, Match, MatchApi} from "@/client";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {MatchesHeader} from "@/app/components/ticket/matches-header";

interface TicketsProps {
    title: string,
    filterType: ListMatchesFilterTypeEnum,
    showInfoButton: boolean,
    admin: boolean,
    extraInfo?: string
}

export default async function Tickets(props: TicketsProps): Promise<React.JSX.Element> {

    async function getGames(): Promise<Match[]> {
        try {
            const matchApi = new MatchApi(await getConfigWithAuthHeader())
            return await matchApi.listMatches({filterType: props.filterType})
        } catch (error) {
            console.log(error)
            return []
        }
    }

    const games = await getGames()

    return (
        <>
            {games.length > 0 && <>
                <MatchesHeader showInfoButton={props.showInfoButton} title={props.title} extraInfo={props.extraInfo}/>
                {games.map((match, index) => {
                    return (
                        <Ticket 
                            match={match} 
                            key={match.matchId} 
                            collapse={index !== 0}
                            admin={props.admin}
                            forPredictionPage={false}
                        />
                    )
                })}
            </>
            }
        </>
    )
}