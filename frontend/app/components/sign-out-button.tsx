'use client'

import {Button} from "@nextui-org/react";
import {BUTTON_CLASS} from "@/app/util/css-classes";
import React from "react";
import {TOKEN_COOKIE_KEY} from "@/app/api/api";
import {deleteCookie} from "cookies-next";

export default function SignOutButton(): React.JSX.Element {

    function handleClick() {
        deleteCookie(TOKEN_COOKIE_KEY);
    }

    return(
        <Button size="sm" onClick={handleClick} className={BUTTON_CLASS}>Sign Out</Button>
    )
}

