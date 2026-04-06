import React from "react"
import Link from "next/link"
import {InfoIcon} from "@/app/components/info-icon";

export function MatchesHeader(props: { 
    showInfoButton: boolean, 
    title: string,
    extraInfo?: string 
}): React.JSX.Element {
    return (
        <div className="w-full">
            <div className="flex items-center w-full text-center">
                {props.showInfoButton 
                    ? (
                        <>
                            <div className="w-1/4"></div>
                            <span className="w-1/2 text-white text-l font-bold mr-4">{props.title}</span>
                            <Link href="/info">
                                <div className="w-1/4 inline-block"><InfoIcon/></div>
                            </Link>
                        </>)
                    : <p className="w-full text-center text-white text-l font-bold mt-3">{props.title}</p>
                }
            </div>
            {props.extraInfo !== undefined && <div className="text-white p-2 text-center">{props.extraInfo}</div>}
        </div>
    )
}