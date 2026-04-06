'use client'

import {Button} from "@nextui-org/react";
import React, {useState} from "react";

interface LandingHeaderLoginButtonProps {
    buttonText?: string
}

const LandingHeaderLoginButton = (props: LandingHeaderLoginButtonProps) => {

    const [isLoading, setIsLoading] = useState(false)

    return (
        <Button
            onClick={() => setIsLoading(true)}
            isLoading={isLoading}
            className={"bg-gradient-to-tr from-blue-600 to-green-300 shadow-lg text-white"}
        >
            {props.buttonText !== undefined ? props.buttonText : "Sign In"}
        </Button>
    )
}

export default LandingHeaderLoginButton