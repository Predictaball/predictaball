'use client'

import React, {useEffect, useState} from "react";
import {League, Match, MatchApi, PredictionWithUser} from "@/client";
import {getConfigWithAuthHeaderClient} from "@/app/api/client-config-client-side";
import PredictionData from "@/app/app/match/[matchId]/predictions/prediction";
import Ticket from "@/app/components/ticket/ticket";
import {Pagination, Select, SelectItem} from "@nextui-org/react"
import BackButton from "@/app/components/back-button"
import useWindowDimensions from "@/app/hooks/use-window-dimension";
import {BUTTON_CLASS} from "@/app/util/css-classes";

export default function Predictions(
    props: {
        leagueId: string,
        matchId: string,
        leagues: League[],
        match: Match
    }
): React.JSX.Element {
    const [leagueId, setLeagueId] = useState(props.leagueId)
    const [predictions, setPredictions] = useState<PredictionWithUser[]>([])
    const [currentPage, setCurrentPage] = useState(0)
    const windowsSize = useWindowDimensions()
    const itemsPerPage = windowsSize.height !== undefined ? Math.max((Math.round(windowsSize.height / 80)) - 5, 1) : 5

    const getPaginatedPredictions = (leaderboard: any[]) => {
        const startIndex = currentPage * itemsPerPage;
        return leaderboard.slice(startIndex, startIndex + itemsPerPage);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page - 1);
    };

    const totalPages = Math.ceil(predictions.length / itemsPerPage);

    useEffect(() => {
        try {
            getConfigWithAuthHeaderClient().then(config => {
                const matchApi = new MatchApi(config)
                matchApi
                    .getMatchPredictions({
                        matchId: props.matchId,
                        leagueId: leagueId
                    }).then(preds => {
                        const sortedPreds = preds.sort((a, b) => {
                            const pointsComparison = b.prediction.points! - a.prediction.points!;
                            if (pointsComparison !== 0) return pointsComparison;

                            const familyNameComparison = a.user.familyName.localeCompare(b.user.familyName);
                            if (familyNameComparison !== 0) return familyNameComparison;

                            return a.user.firstName.localeCompare(b.user.firstName)
                        })
                    setPredictions(sortedPreds)
                    setCurrentPage(0)
                })
            })
        } catch (error) {
            console.log(error)
        }
    }, [leagueId, props.matchId])

    return (
        <div className="min-h-svh bg-gray-900">
            <div className="w-full max-w-4xl mx-auto relative">
                <div className="flex justify-between p-4">
                    <div>
                        <BackButton/>
                    </div>
                    <Select
                        label="Filter By League"
                        className="w-1/2"
                        size="sm"
                        onChange={(event) => {
                            setLeagueId(event.target.value)
                        }}
                    >
                        {props.leagues.map(league => {
                            return (
                                <SelectItem key={league.leagueId}>
                                    {league.name}
                                </SelectItem>
                            )
                        })}
                    </Select>
                </div>
                <div className="p-2 -mt-4 w-full bg-gray-900 flex flex-col items-center">
                    {<Ticket forPredictionPage match={props.match} collapse admin={false}/>}
                    {getPaginatedPredictions(predictions).map((predictionWithUser, index) => <PredictionData key={index}
                                                                                                             predictionWithUser={predictionWithUser}/>)}
                    {totalPages > 1 &&
                        <Pagination showControls radius="full" total={totalPages} initialPage={1}
                                    onChange={handlePageChange}
                                    className="fixed bottom-4"
                                    classNames={{
                                        cursor: BUTTON_CLASS,
                                        item: "bg-transparent text-white hover:text-black hover:bg-white"
                                    }}
                        />}
                </div>
            </div>
        </div>
    )
}