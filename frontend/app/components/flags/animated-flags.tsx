import FlagAnimated from "@/app/components/flags/flag-animated";
import React from "react";
import {FLAG_CODES} from "@/app/util/teams";

interface AnimatedFlagProps {
    bottom: string,
    invert: boolean,
    hostCountries?: boolean
}

export default function AnimatedFlags(props: AnimatedFlagProps): React.JSX.Element {

    function getFlags(): React.JSX.Element[] {
        const codes = props.hostCountries 
            ? Array(20).fill(['us', 'ca', 'mx']).flat().slice(0, 20)
            : FLAG_CODES.sort(() => 0.5 - Math.random()).slice(0, 20);
        
        return codes.map((code, i) =>
            <FlagAnimated
                bottom={props.bottom}
                index={i}
                key={i}
                invert={props.invert}
                flagCode={code}
            />
        )
    }

    return(
        <>
            {getFlags()}
        </>
    )
}
