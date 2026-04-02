import {MatchStateEnum} from "@/client";
import React from "react";

interface LivePulseProps {
    matchState: MatchStateEnum
}

export default function LivePulse(props: LivePulseProps): React.JSX.Element {
    return props.matchState === MatchStateEnum.Live
        ? <div className="absolute top-1 -right-4 w-4 h-4 bg-red-500 rounded-full animate-ping overflow-hidden"></div>
        : <></>
}