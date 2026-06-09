import React from "react";
import {Header} from "@/app/components/landing-header";
import FlagGlobe from "@/app/components/flags/flag-globe-client";
import HowItWorks from "@/app/components/landing/how-it-works";

export default async function Home(): Promise<React.JSX.Element> {

    return (
        <main className="bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-auto">
            <section className="relative flex flex-col p-10 h-svh">
                <div className="absolute top-0 left-0 right-0 p-10 z-50">
                    <Header/>
                </div>

                <div className="relative z-40 flex flex-1 flex-col lg:flex-row items-center gap-8 lg:gap-12 pt-20 lg:pt-0">
                    <div className="flex-1 w-full max-w-[700px] text-center lg:text-left font-display">
                        <div className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight">
                            FOOTBALL
                        </div>
                        <div className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight">
                            JUST GOT
                        </div>
                        <div className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[1.05] tracking-tight bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-300 inline-block text-transparent bg-clip-text animate-gradient" style={{backgroundSize: '200% 200%'}}>
                            FUNNER
                        </div>
                        <div className="font-sans mt-6 text-lg md:text-xl text-slate-600 dark:text-gray-300">
                            World Cup 2026 Score Predictor
                        </div>
                    </div>

                    <div className="relative flex-1 w-screen -mx-10 md:w-full md:mx-0 min-h-[420px] md:min-h-[520px] lg:min-h-0 lg:h-full lg:self-stretch">
                        <FlagGlobe/>
                    </div>
                </div>
            </section>

            <section className="relative flex flex-col items-center px-6 lg:px-10 py-24 min-h-svh overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_55%)]"/>

                <HowItWorks>
                    <div className="mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-teal-400/20 p-[1px]">
                        <div className="rounded-3xl bg-white dark:bg-gray-900/90 backdrop-blur-sm px-8 py-14 text-center">
                            <h3 className="font-display text-4xl lg:text-5xl font-black tracking-tight">
                                Ready to <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">play</span>?
                            </h3>
                            <p className="mt-4 text-lg text-slate-600 dark:text-gray-300">Sign up now and start predicting.</p>
                            <a href="/login" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-300 px-7 py-3 font-semibold text-gray-900 shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105">
                                Get started
                                <span>&rarr;</span>
                            </a>
                        </div>
                    </div>
                </HowItWorks>
            </section>

        </main>
    );
}
