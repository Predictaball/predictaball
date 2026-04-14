import React from "react";
import AnimatedFlags from "@/app/components/flags/animated-flags";
import {Header} from "@/app/components/landing-header";

export default async function Home(): Promise<React.JSX.Element> {

    function getFlags(): React.JSX.Element[] {
        return [
            <AnimatedFlags bottom="75%" invert={false} hostCountries={true} key={0} />,
            <AnimatedFlags bottom="15%" invert={true} key={1} />
        ]
    }

    return (
        <main className="bg-gray-900 text-white overflow-auto">
            <section className="relative flex flex-col items-center justify-center p-10 h-svh overflow-hidden">
                <div className="absolute top-0 left-0 right-0 p-10">
                    <Header/>
                </div>
                <div className="w-full max-w-[800px] text-center z-40 -mt+140">
                    <div className="text-6xl lg:text-8xl font-bold leading-tight">
                        FOOTBALL
                    </div>
                    <div className="text-6xl lg:text-8xl font-bold leading-tight">
                        JUST GOT
                    </div>
                    <div className="text-7xl lg:text-9xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-cyan-400 to-green-300 inline-block text-transparent bg-clip-text animate-gradient" style={{backgroundSize: '200% 200%'}}>
                        FUNNER
                    </div>
                </div>
                {getFlags()}
                <div className="absolute bottom-10 text-xl text-gray-300 z-40">
                    World Cup 2026 Score Predictor
                </div>
            </section>

            <section className="relative flex flex-col items-center px-6 lg:px-10 py-24 min-h-svh overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_55%)]"/>

                <div className="relative max-w-5xl w-full">
                    <div className="flex flex-col items-center text-center mb-20">
                        <span className="text-xs font-semibold tracking-[0.3em] text-cyan-300/80 uppercase mb-4">How it works</span>
                        <h2 className="text-5xl lg:text-7xl font-black tracking-tight">
                            <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-green-300 bg-clip-text text-transparent">
                                Predict every game.
                            </span>
                            <br/>
                            <span className="text-white">Climb the table.</span>
                        </h2>
                        <p className="mt-8 max-w-2xl text-lg text-gray-300 leading-relaxed">
                            Predictaball challenges you to call the score of <span className="font-semibold text-white">every</span> match of World Cup 2026. Sharper predictions earn more points — come back daily to lock in the next two match days.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="group relative rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                            <div className="relative h-full rounded-2xl bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-400/20 ring-1 ring-cyan-400/30 text-2xl mb-5">
                                    &#128526;
                                </div>
                                <h3 className="text-xl font-bold mb-2 tracking-tight">The Prize</h3>
                                <p className="text-gray-400 leading-relaxed">Bragging rights — the purest currency there is.</p>
                            </div>
                        </div>

                        <div className="group relative rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                            <div className="relative h-full rounded-2xl bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-green-400/20 ring-1 ring-cyan-400/30 text-2xl mb-5">
                                    &#127942;
                                </div>
                                <h3 className="text-xl font-bold mb-2 tracking-tight">Leagues</h3>
                                <p className="text-gray-400 leading-relaxed">Spin up a private league, invite friends, and stake a prize — or invent a forfeit worth fearing.</p>
                            </div>
                        </div>

                        <div className="group relative rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                            <div className="relative h-full rounded-2xl bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-400/20 ring-1 ring-green-400/30 text-2xl mb-5">
                                    &#129306;
                                </div>
                                <h3 className="text-xl font-bold mb-2 tracking-tight">Scoring</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li className="flex items-baseline gap-2">
                                        <span className="font-mono font-bold text-cyan-300 text-sm">5pt</span>
                                        <span>Exact score</span>
                                    </li>
                                    <li className="flex items-baseline gap-2">
                                        <span className="font-mono font-bold text-cyan-300 text-sm">2pt</span>
                                        <span>Correct result</span>
                                    </li>
                                </ul>
                                <p className="mt-4 text-xs text-gray-500">&#10024; Knockouts use an updated scoring system.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-green-400/20 p-[1px]">
                        <div className="rounded-3xl bg-gray-900/90 backdrop-blur-sm px-8 py-14 text-center">
                            <h3 className="text-4xl lg:text-5xl font-black tracking-tight">
                                Ready to <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-green-300 bg-clip-text text-transparent">play</span>?
                            </h3>
                            <p className="mt-4 text-lg text-gray-300">Sign up now and start predicting.</p>
                            <a href="/login" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-green-300 px-7 py-3 font-semibold text-gray-900 shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105">
                                Get started
                                <span>&rarr;</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
