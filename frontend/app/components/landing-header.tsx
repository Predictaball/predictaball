'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCookie } from "cookies-next";
import { TOKEN_COOKIE_KEY } from "@/app/api/api";
import LandingHeaderLoginButton from "@/app/components/landing-header-login-button";

export function Header(): React.JSX.Element {
    const [loggedIn, setLoggedIn] = useState(false)

    useEffect(() => {
        setLoggedIn(!!getCookie(TOKEN_COOKIE_KEY))
    }, [])

    const buttonText = loggedIn ? "Go to App" : "Sign In"
    const href = loggedIn ? "/app" : "/login"

    return <div className="z-50 w-full items-center justify-between text-sm flex max-w-3xl">
        <Link href="/">PREDICTABALL.LIVE</Link>
        <Link href={href}>
            <LandingHeaderLoginButton buttonText={buttonText}/>
        </Link>
    </div>
}
