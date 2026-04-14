import React from "react";
import Link from "next/link";
import LandingHeaderLoginButton from "@/app/components/landing-header-login-button";

export function Header(): React.JSX.Element {
    return <div className="z-50 w-full items-center justify-center text-sm flex">
        <div className="w-full max-w-[800px] flex justify-between">
            <Link href="/" className="group flex items-center gap-2">
                <span className="flex items-baseline font-black tracking-tight">
                    <span className="text-lg bg-gradient-to-r from-blue-500 via-cyan-300 to-green-300 bg-clip-text text-transparent">
                        predicta
                    </span>
                    <span className="text-lg text-white">ball</span>
                    <span className="ml-0.5 text-xs font-medium tracking-[0.2em] text-gray-400">.LIVE</span>
                </span>
            </Link>
            <Link href="/login">
                <LandingHeaderLoginButton buttonText="Sign In"/>
            </Link>
        </div>
    </div>
}
