'use client'

import {Button} from "@nextui-org/react";
import React from "react";

interface LandingHeaderLoginButtonProps {
    buttonText?: string
}

const LandingHeaderLoginButton = (props: LandingHeaderLoginButtonProps) => {
    return (
        <div className="group relative inline-flex rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-green-300 p-[1.5px] shadow-lg shadow-cyan-500/10 transition-all hover:shadow-cyan-500/30 hover:scale-105">
            <Button
                className="rounded-full bg-gray-900 text-white font-semibold tracking-wide px-5 h-9 min-w-0 group-hover:bg-gray-900/80"
            >
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-green-300 bg-clip-text text-transparent">
                    {props.buttonText !== undefined ? props.buttonText : "Sign In"}
                </span>
                <span className="ml-1 text-cyan-300 transition-transform group-hover:translate-x-0.5">→</span>
            </Button>
        </div>
    )
}

export default LandingHeaderLoginButton
