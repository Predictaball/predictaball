import React, {Suspense} from "react";
import Tickets from "@/app/components/ticket/tickets";
import {ListMatchesFilterTypeEnum} from "@/client";
import TicketSkeleton from "@/app/components/ticket/ticket-skeleton";

export default function MatchesToPredict(): React.JSX.Element {
    return (
        <div className="flex flex-wrap w-full content-center justify-center">
            <Suspense fallback={<><TicketSkeleton /><TicketSkeleton /></>}>
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
