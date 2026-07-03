import React from "react";

/**
 * The "How it works" + "Power-ups" explainer shared by the public landing page
 * and the post-signup onboarding flow. Render a call-to-action as children to
 * have it sit, consistently spaced, beneath the grids.
 */
export default function HowItWorks({children, compact}: {children?: React.ReactNode; compact?: boolean}): React.JSX.Element {
    const primaryHeading = compact ? "text-4xl lg:text-5xl" : "text-5xl lg:text-7xl"
    const secondaryHeading = compact ? "text-3xl lg:text-5xl" : "text-4xl lg:text-6xl"
    return (
        <div className="relative max-w-5xl w-full mx-auto">
            <div className={`flex flex-col items-center text-center ${compact ? "mb-12" : "mb-20"}`}>
                <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase mb-4">How it works</span>
                <h2 className={`font-display ${primaryHeading} font-black tracking-tight`}>
                    <span className="text-indigo-600 dark:text-indigo-400">
                        Predict every game.
                    </span>
                    <br/>
                    <span className="text-slate-900 dark:text-white">Climb the table.</span>
                </h2>
                <p className="mt-8 max-w-2xl text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
                    Predictaball challenges you to call the score of <span className="font-semibold text-slate-900 dark:text-white">every</span> match of World Cup 2026. Sharper predictions earn more points — come back daily to lock in the next three match days.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="group relative rounded-xl bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-white/10 dark:to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                    <div className="relative h-full rounded-[11px] bg-white dark:bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/30 to-cyan-400/20 ring-1 ring-cyan-400/30 text-2xl mb-5">
                            &#128526;
                        </div>
                        <h3 className="text-xl font-bold mb-2 tracking-tight">The Prize</h3>
                        <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Bragging rights — the purest currency there is.</p>
                    </div>
                </div>

                <div className="group relative rounded-xl bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-white/10 dark:to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                    <div className="relative h-full rounded-[11px] bg-white dark:bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-teal-400/20 ring-1 ring-cyan-400/30 text-2xl mb-5">
                            &#127942;
                        </div>
                        <h3 className="text-xl font-bold mb-2 tracking-tight">Leagues</h3>
                        <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Spin up a private league, invite friends, and stake a prize — or invent a forfeit worth fearing.</p>
                    </div>
                </div>

                <div className="group relative rounded-xl bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-white/10 dark:to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                    <div className="relative h-full rounded-[11px] bg-white dark:bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-indigo-400/20 ring-1 ring-violet-400/30 text-2xl mb-5">
                            &#129306;
                        </div>
                        <h3 className="text-xl font-bold mb-2 tracking-tight">Scoring</h3>
                        <ul className="space-y-2 text-slate-600 dark:text-gray-400">
                            <li className="flex items-baseline gap-2">
                                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300 text-sm">5pt</span>
                                <span>Exact score</span>
                            </li>
                            <li className="flex items-baseline gap-2">
                                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300 text-sm">2pt</span>
                                <span>Correct result</span>
                            </li>
                        </ul>
                        <p className="mt-4 text-xs text-slate-500 dark:text-gray-500">&#10024; Knockouts use an updated scoring system.</p>
                    </div>
                </div>
            </div>

            <div className={`flex flex-col items-center text-center ${compact ? "mt-20 mb-12" : "mt-28 mb-16"}`}>
                <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase mb-4">Power-ups</span>
                <h2 className={`font-display ${secondaryHeading} font-black tracking-tight`}>
                    <span className="text-slate-900 dark:text-white">Play your </span>
                    <span className="text-indigo-600 dark:text-indigo-400">chips</span>
                    <span className="text-slate-900 dark:text-white"> wisely.</span>
                </h2>
                <p className="mt-8 max-w-2xl text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
                    Every player gets <span className="font-semibold text-slate-900 dark:text-white">three of each</span> power-up to spend across the tournament. Attach one to any prediction before kickoff to bend the scoring in your favour — but choose carefully, because once they&apos;re gone, they&apos;re gone.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="group relative rounded-xl bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-white/10 dark:to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                    <div className="relative h-full rounded-[11px] bg-white dark:bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/30 to-cyan-400/20 ring-1 ring-cyan-400/30 font-black text-cyan-600 dark:text-cyan-300 mb-5">
                            2&times;
                        </div>
                        <h3 className="text-xl font-bold mb-2 tracking-tight">Double Points</h3>
                        <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Doubles every point that prediction earns. Back a banker and cash in twice over.</p>
                    </div>
                </div>

                <div className="group relative rounded-xl bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-white/10 dark:to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                    <div className="relative h-full rounded-[11px] bg-white dark:bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-teal-400/20 ring-1 ring-cyan-400/30 font-black text-cyan-600 dark:text-cyan-300 mb-5">
                            &plusmn;1
                        </div>
                        <h3 className="text-xl font-bold mb-2 tracking-tight">Off by One</h3>
                        <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Scores as if either side&apos;s goal tally was one closer, so a near-miss can still land the full five points.</p>
                    </div>
                </div>

                <div className="group relative rounded-xl bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-white/10 dark:to-white/5 p-[1px] transition-transform hover:-translate-y-1">
                    <div className="relative h-full rounded-[11px] bg-white dark:bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-indigo-400/20 ring-1 ring-violet-400/30 font-black text-cyan-600 dark:text-cyan-300 mb-5">
                            %
                        </div>
                        <h3 className="text-xl font-bold mb-2 tracking-tight">Follow the Crowd</h3>
                        <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Locks in the most popular prediction at kickoff. Can&apos;t make your mind up? Let the wisdom of the crowd decide.</p>
                    </div>
                </div>
            </div>

            {children}
        </div>
    )
}
