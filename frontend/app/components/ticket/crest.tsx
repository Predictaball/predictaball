import React from "react";
import Image from "next/image";
import {getFlagUrl} from "@/app/util/flag";

interface CrestProps {
    country: string,
    flagCode: string,
    large: boolean
}

export default function Crest(props: CrestProps): React.JSX.Element {
    return (
        <div className="flex flex-col items-center">
            <Image
                src={getFlagUrl(props.flagCode)}
                alt={props.country}
                width={80}
                height={53}
                style={{
                    width: props.large ? "80px" : "75px",
                    height: props.large ? "53px" : "50px",
                    objectFit: "contain",
            }}
            />
            <span className="text-center text-xs font-bold text-slate-900 dark:text-white">
                {props.country.charAt(0).toUpperCase() + props.country.slice(1)}
            </span>
        </div>
    )
}
