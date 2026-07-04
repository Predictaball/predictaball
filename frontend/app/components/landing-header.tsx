import React from "react";
import Link from "next/link";
import LandingHeaderLoginButton from "@/app/components/landing-header-login-button";
import ThemeToggle from "@/app/components/theme-toggle";
import Wordmark from "@/app/components/wordmark";

export function Header(): React.JSX.Element {
    return <div className="z-50 w-full items-center justify-center text-sm flex">
        <div className="w-full max-w-[800px] flex justify-between items-center">
            <Wordmark className="group font-display"/>
            <div className="flex items-center gap-3">
                <ThemeToggle/>
                <Link href="/login">
                    <LandingHeaderLoginButton buttonText="Sign In"/>
                </Link>
            </div>
        </div>
    </div>
}
