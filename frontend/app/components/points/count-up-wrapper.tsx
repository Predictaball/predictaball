'use client'

import CountUp from "react-countup";
import React from "react";

interface CountUpWrappedProps {
    end: number,
}

export default function CountUpWrapped(props: CountUpWrappedProps): React.JSX.Element {
    return (
        <CountUp end={props.end} duration={2.5}/>
    )
}