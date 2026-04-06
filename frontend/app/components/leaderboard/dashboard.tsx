import React, {Suspense} from "react";
import Leagues from "@/app/components/leaderboard/leagues";

export default function Dashboard(): React.JSX.Element {
    return(
        <Suspense fallback={<></>}>
            <Leagues/>
        </Suspense>
    )
}