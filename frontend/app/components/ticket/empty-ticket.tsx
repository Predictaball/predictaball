import React from "react";
import {getClippedTextForTeam} from "@/app/components/ticket/clipped-text";
import { Spinner } from "@nextui-org/react";

export default function EmptyTicket(): React.JSX.Element {
    return(
        <div className="w-full p-3 text-gray-600 relative">
            <div className="w-full p-3 flex-row justify-between max-w-xl rounded-large bg-gray-100">
                <div className="flex justify-around" style={{marginTop: "-20px"}}>
                    <div className="content-center">
                    <span style={getClippedTextForTeam("https://predictaball-teamflagsbucketb6ca46de-2uk8faboxd6r.s3.eu-west-2.amazonaws.com/placeholder.svg")}>
                        LOADING
                    </span>
                    </div>
                </div>
                <div className="flex justify-around">
                    <div className="content-center">
                        <Spinner size="lg"/>
                    </div>
                </div>
            </div>
        </div>
    )
}