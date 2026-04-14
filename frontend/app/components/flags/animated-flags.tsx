import FlagAnimated from "@/app/components/flags/flag-animated";
import React from "react";
import {FLAG_CODES} from "@/app/util/teams";

interface AnimatedFlagProps {
    bottom: string,
    invert: boolean,
    hostCountries?: boolean,
    className?: string
}

export default function AnimatedFlags(props: AnimatedFlagProps): React.JSX.Element {

    function getFlags(): React.JSX.Element[] {
        const count = 20;
        const codes = props.hostCountries
            ? Array(count).fill(['us', 'ca', 'mx']).flat().slice(0, count)
            : [...FLAG_CODES].slice(0, count);

        return codes.map((code, i) =>
            <FlagAnimated key={i} flagCode={code}/>
        )
    }

    const flags = getFlags();

    return(
        <div
            className={`absolute left-0 right-0 overflow-hidden pointer-events-none ${props.className ?? ''}`}
            style={{bottom: props.bottom}}
        >
            <div className={`flex w-max ${props.invert ? 'animate-scrollReverse' : 'animate-scroll'}`}>
                {flags}
                {flags}
            </div>
        </div>
    )
}
