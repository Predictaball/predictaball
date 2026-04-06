'use client'

import React, {useState} from "react";
import {Match, MatchRoundEnum} from "@/client";
import Entry from "@/app/components/ticket/entry";
import {DROP_DOWN, DROP_UP} from "@/app/components/ticket/drop-downs";
import TeamsHeader from "@/app/components/ticket/teams-header";
import {LocalTime} from "./local-time";

interface TicketProps {
    match: Match,
    collapse: boolean,
    admin: boolean,
    forPredictionPage: boolean
}

export default function Ticket(props: TicketProps): React.JSX.Element {
    const [collapse, setCollapse] = useState<boolean>(props.collapse)

    const RoundToString: Map<MatchRoundEnum, string> = new Map([
        [MatchRoundEnum.GroupStage, "Group Stage"],
        [MatchRoundEnum.RoundOfSixteen, "Round of Sixteen"],
        [MatchRoundEnum.QuarterFinal, "Quarter-Final"],
        [MatchRoundEnum.SemiFinal, "Semi-Final"],
        [MatchRoundEnum.Final, "Final"]
    ])

    return (
        <div
            className="w-full max-w-lg p-3 text-gray-600 relative"
        >
            <div className="w-full p-3 flex-row justify-between max-w-xl rounded-large bg-gray-200"
                 style={{height: "6.5rem"}} onClick={() => {
                if (props.forPredictionPage) return
                setCollapse(!collapse)
            }}>
                <div className="flex justify-around" style={{marginTop: "-20px"}}>
                    <TeamsHeader match={props.match} showPoints={!props.admin}/>
                </div>
                {!props.forPredictionPage && <div className={"w-full flex justify-center content-center items-center animate-bounce"}
                     style={{marginTop: "-25px"}}>
                    {collapse ? DROP_DOWN : DROP_UP}
                </div>}
            </div>
            {!collapse && !props.forPredictionPage && <div
                className="w-full p-3 flex-row justify-between max-w-xl rounded-large bg-gray-200 animate-appearance-in">
                <div className="w-full flex justify-between">
                    <div className="flex-row">
                        <div className="font-bold">
                            ROUND
                        </div>
                        <div className="text-xs">
                            {RoundToString.get(props.match.round)}
                        </div>
                    </div>
                    <div className="flex-row text-right">
                        <div className="font-bold">
                            DATE
                        </div>
                        <div className="text-xs">
                            <LocalTime date={props.match.datetime}/>
                        </div>
                    </div>
                </div>
            </div>}
            <div
                className="w-full max-w-xl p-3 rounded-large border-gray-200 border-2 animate-appearance-in animation-delay-0">
                <Entry match={props.match} admin={props.admin} forPredictionPage={props.forPredictionPage}/>
            </div>
        </div>
    )
}