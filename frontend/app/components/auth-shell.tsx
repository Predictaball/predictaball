import React from "react"
import Link from "next/link"
import FlagGlobeClient from "@/app/components/flags/flag-globe-client"

interface AuthShellProps {
    title: string
    children: React.ReactNode
}

export default function AuthShell({title, children}: AuthShellProps): React.JSX.Element {
    return (
        <section className="relative min-h-svh bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-hidden">

            <div
                className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
                aria-hidden
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-[120vmin] w-[120vmin] max-w-none">
                        <FlagGlobeClient interactive={false}/>
                    </div>
                </div>
            </div>

            <div className="relative flex flex-col items-center justify-center px-6 py-12 min-h-svh">
                <Link href="/" className="group flex items-center mb-8">
                    <span className="font-display flex items-baseline font-black tracking-tight text-lg">
                        <span className="text-pitch-700 dark:text-pitch-300">
                            predicta
                        </span>
                        <span className="text-slate-900 dark:text-white">ball</span>
                        <span className="ml-0.5 text-xs font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
                    </span>
                </Link>

                <div className="relative w-full max-w-md rounded-xl border-[1.5px] border-slate-300 dark:border-white/15 bg-white dark:bg-gray-900">
                    <div className="rounded-xl p-6 sm:p-8">
                        <h1 className="text-2xl font-black tracking-tight text-center mb-6">
                            {title}
                        </h1>
                        {children}
                    </div>
                </div>

                <p className="relative mt-8 text-xs text-slate-500 dark:text-gray-400 text-center">
                    By continuing you agree to our{" "}
                    <Link href="/privacy-policy" className="underline hover:text-slate-900 dark:hover:text-white">
                        Privacy Policy
                    </Link>
                    {" "}and{" "}
                    <Link href="/cookie-policy" className="underline hover:text-slate-900 dark:hover:text-white">
                        Cookie Policy
                    </Link>.
                </p>
            </div>
        </section>
    )
}
