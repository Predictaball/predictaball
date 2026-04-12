'use client'

import {Button} from "@nextui-org/react";
import React from "react";

interface LandingHeaderLoginButtonProps {
    buttonText?: string
}

const LandingHeaderLoginButton = (props: LandingHeaderLoginButtonProps) => {
    return (
        <Button
            className={"bg-gradient-to-tr from-blue-600 to-green-300 shadow-lg text-white"}
        >
            {props.buttonText !== undefined ? props.buttonText : "Sign In"}
        </Button>
    )
}

export default LandingHeaderLoginButton
