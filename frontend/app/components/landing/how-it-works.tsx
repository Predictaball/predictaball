import React from "react";
import FeatureCard from "@/app/components/feature-card";
import {BRAND_TEXT_GRADIENT_LIGHT, EYEBROW_CYAN, TEXT_PRIMARY} from "@/app/util/css-classes";

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
                <span className={`${EYEBROW_CYAN} mb-4`}>How it works</span>
                <h2 className={`font-display ${primaryHeading} font-black tracking-tight`}>
                    <span className={BRAND_TEXT_GRADIENT_LIGHT}>
                        Predict every game.
                    </span>
                    <br/>
                    <span className={TEXT_PRIMARY}>Climb the table.</span>
                </h2>
                <p className="mt-8 max-w-2xl text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
                    Predictaball challenges you to call the score of <span className={`font-semibold ${TEXT_PRIMARY}`}>every</span> match of World Cup 2026. Sharper predictions earn more points — come back daily to lock in the next three match days.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <FeatureCard accent="from-blue-600/30 to-cyan-400/20 ring-cyan-400/30 text-2xl" icon="😎" title="The Prize">
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Bragging rights — the purest currency there is.</p>
                </FeatureCard>

                <FeatureCard accent="from-cyan-500/30 to-teal-400/20 ring-cyan-400/30 text-2xl" icon="🏆" title="Leagues">
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Spin up a private league, invite friends, and stake a prize — or invent a forfeit worth fearing.</p>
                </FeatureCard>

                <FeatureCard accent="from-green-500/30 to-emerald-400/20 ring-green-400/30 text-2xl" icon="🤞" title="Scoring">
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
                </FeatureCard>
            </div>

            <div className={`flex flex-col items-center text-center ${compact ? "mt-20 mb-12" : "mt-28 mb-16"}`}>
                <span className={`${EYEBROW_CYAN} mb-4`}>Power-ups</span>
                <h2 className={`font-display ${secondaryHeading} font-black tracking-tight`}>
                    <span className={TEXT_PRIMARY}>Play your </span>
                    <span className={BRAND_TEXT_GRADIENT_LIGHT}>chips</span>
                    <span className={TEXT_PRIMARY}> wisely.</span>
                </h2>
                <p className="mt-8 max-w-2xl text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
                    Every player gets <span className={`font-semibold ${TEXT_PRIMARY}`}>three of each</span> power-up to spend across the tournament. Attach one to any prediction before kickoff to bend the scoring in your favour — but choose carefully, because once they&apos;re gone, they&apos;re gone.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <FeatureCard accent="from-blue-600/30 to-cyan-400/20 ring-cyan-400/30 font-black text-cyan-600 dark:text-cyan-300" icon="2×" title="Double Points">
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Doubles every point that prediction earns. Back a banker and cash in twice over.</p>
                </FeatureCard>

                <FeatureCard accent="from-cyan-500/30 to-teal-400/20 ring-cyan-400/30 font-black text-cyan-600 dark:text-cyan-300" icon="±1" title="Off by One">
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Scores as if either side&apos;s goal tally was one closer, so a near-miss can still land the full five points.</p>
                </FeatureCard>

                <FeatureCard accent="from-green-500/30 to-emerald-400/20 ring-green-400/30 font-black text-cyan-600 dark:text-cyan-300" icon="%" title="Follow the Crowd">
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed">Locks in the most popular prediction at kickoff. Can&apos;t make your mind up? Let the wisdom of the crowd decide.</p>
                </FeatureCard>
            </div>

            {children}
        </div>
    )
}
