import React from "react"
import Link from "next/link"
import FlagGlobeClient from "@/app/components/flags/flag-globe-client"

interface AuthShellProps {
    title: string
    children: React.ReactNode
}

export default function AuthShell({title, children}: AuthShellProps): React.JSX.Element {
    return (
        <section className="relative min-h-svh bg-gray-900 text-white overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.12),transparent_55%)]"/>

            <div
                className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
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
                    <span className="flex items-baseline font-black tracking-tight text-lg">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-green-300 bg-clip-text text-transparent">
                            predicta
                        </span>
                        <span className="text-white">ball</span>
                        <span className="ml-0.5 text-xs font-medium tracking-[0.2em] text-gray-400">.LIVE</span>
                    </span>
                </Link>

                <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-white/15 to-white/5 p-[1px]">
                    <div className="rounded-2xl bg-gray-900/80 backdrop-blur-xl p-6 sm:p-8">
                        <h1 className="text-2xl font-black tracking-tight text-center mb-6">
                            {title}
                        </h1>
                        {children}
                    </div>
                </div>
            </div>
        </section>
    )
}
