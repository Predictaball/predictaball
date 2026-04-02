import React from "react";
import {PredictionWithUser} from "@/client";
import Link from "next/link";
import {generateHistoryPageLinkForUser} from "@/app/app/user/[userId]/history/user-link-generator";
import {calculateResult, RESULT_TO_STYLE} from "@/app/components/points/result-styles"
import PredictionData from "@/app/app/match/[matchId]/predictions/prediction-data";

export default function PredictionWithLink(props: {
    predictionWithUser: PredictionWithUser
}): React.JSX.Element {
    return (
        <Link
            className="w-full flex items-center mt-2 max-w-xl text-center p-3 rounded-3xl animate-appearance-in animation-delay-0"
            style={RESULT_TO_STYLE.get(calculateResult(props.predictionWithUser.prediction.points!))!}
            href={generateHistoryPageLinkForUser(props.predictionWithUser.user)}
        >
            <PredictionData predictionWithUser={props.predictionWithUser}/>
        </Link>
    )
}