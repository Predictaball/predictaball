import React from "react";
import Link from "next/link";
import LandingHeaderLoginButton from "@/app/components/landing-header-login-button";

interface HeaderProps {
    buttonText?: string
}

export function Header(props: HeaderProps): React.JSX.Element {
    return <div className="z-50 w-full items-center justify-between text-sm flex max-w-3xl">
        <Link href="/">PREDICTABALL.LIVE</Link>
        <Link href="/login">
            <LandingHeaderLoginButton buttonText={props.buttonText}/>
        </Link>
    </div>
}
