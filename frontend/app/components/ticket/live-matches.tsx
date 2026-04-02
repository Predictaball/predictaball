import React, {Suspense} from "react";
import Tickets from "@/app/components/ticket/tickets";
import {ListMatchesFilterTypeEnum} from "@/client";

export default function LiveMatches(props: {admin: boolean}): React.JSX.Element {
    return (
        <div className="flex flex-wrap w-full content-center justify-center">
            <Suspense fallback={<></>}>
                <Tickets title={"Live Matches"} showInfoButton={false} filterType={ListMatchesFilterTypeEnum.Live} admin={props.admin}/>
            </Suspense>
        </div>
    )
}