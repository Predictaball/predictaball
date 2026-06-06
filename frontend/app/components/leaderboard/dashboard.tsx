import React, {Suspense} from "react";
import Leagues from "@/app/components/leaderboard/leagues";
import {League} from "@/client";

export default function Dashboard({initialLeagues}: {initialLeagues: League[]}): React.JSX.Element {
    return(
        <Suspense fallback={<></>}>
            <Leagues initialLeagues={initialLeagues}/>
        </Suspense>
    )
}
