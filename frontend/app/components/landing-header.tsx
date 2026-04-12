import React from "react";
import Link from "next/link";
import LandingHeaderLoginButton from "@/app/components/landing-header-login-button";

export function Header(): React.JSX.Element {
    return <div className="z-50 w-full items-center justify-center text-sm flex">
        <div className="w-full max-w-[800px] flex justify-between">
            <Link href="/">PREDICTABALL.LIVE</Link>
            <Link href="/login">
                <LandingHeaderLoginButton buttonText="Sign In"/>
            </Link>
        </div>
    </div>
}
