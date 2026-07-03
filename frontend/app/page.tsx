import React from "react";
import {Header} from "@/app/components/landing-header";
import FlagGlobe from "@/app/components/flags/flag-globe-client";
import HowItWorks from "@/app/components/landing/how-it-works";
import {PitchPerspective} from "@/app/components/atmosphere";

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
                        <div className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[1.05] tracking-tight text-pitch-600 dark:text-pitch-400">
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
                <div className="pointer-events-none absolute inset-x-0 top-0 h-svh"><PitchPerspective/></div>

                <HowItWorks>
                    <div className="mt-24 relative overflow-hidden rounded-xl border-2 border-pitch-700 dark:border-pitch-400 bg-white dark:bg-gray-900 px-8 py-14 text-center">
                        <h3 className="font-display text-4xl lg:text-5xl font-black tracking-tight">
                            Ready to <span className="text-pitch-700 dark:text-pitch-300">play</span>?
                        </h3>
                        <p className="mt-4 text-lg text-slate-600 dark:text-gray-300">Sign up now and start predicting.</p>
                        <a href="/login" className="mt-8 inline-flex items-center gap-2 rounded-md bg-pitch-600 hover:bg-pitch-500 dark:bg-pitch-400 dark:hover:bg-pitch-300 px-7 py-3 font-display font-bold uppercase tracking-wide text-white dark:text-gray-950 transition-colors">
                            Get started
                            <span>&rarr;</span>
                        </a>
                    </div>
                </HowItWorks>
            </section>

        </main>
    );
}
