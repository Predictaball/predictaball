import React, {Suspense} from "react";
import Tickets from "@/app/components/ticket/tickets";
import EmptyTicket from "@/app/components/ticket/empty-ticket";
import {ListMatchesFilterTypeEnum} from "@/client";

export default function MatchesToPredict(): React.JSX.Element {
    return (
        <div className="flex flex-wrap w-full content-center justify-center">
            <Suspense fallback={<EmptyTicket />}>
                <Tickets 
                    title="Upcoming Matches" 
                    showInfoButton
                    filterType={ListMatchesFilterTypeEnum.Upcoming} 
                    admin={false}
                    extraInfo="Predict the score when the match ends, including any extra time."
                />
            </Suspense>
        </div>
    )
}