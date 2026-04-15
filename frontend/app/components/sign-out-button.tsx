'use client'

import {Button} from "@nextui-org/react";
import {GHOST_BUTTON_CLASS} from "@/app/util/css-classes";
import React from "react";
import {TOKEN_COOKIE_KEY, REFRESH_TOKEN_COOKIE_KEY} from "@/app/api/api";
import {deleteCookie} from "cookies-next";
import {navigateTo} from "@/app/actions";

export default function SignOutButton(): React.JSX.Element {
    function handleClick() {
        deleteCookie(TOKEN_COOKIE_KEY)
        deleteCookie(REFRESH_TOKEN_COOKIE_KEY)
        navigateTo("")
    }

    return (
        <Button size="sm" radius="full" onPress={handleClick} className={GHOST_BUTTON_CLASS}>
            Sign out
        </Button>
    )
}
