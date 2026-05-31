import React from "react"
import Link from "next/link"
import {Header} from "@/app/components/landing-header"
import LegalFooter from "@/app/components/legal-footer"

export const metadata = {
    title: "Privacy Policy | Predictaball.live",
    description: "How Predictaball collects and uses your personal data",
}

export default function PrivacyPolicy(): React.JSX.Element {
    return (
        <main className="bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white min-h-svh flex flex-col">
            <div className="p-10">
                <Header/>
            </div>

            <section className="flex-1 px-6 lg:px-10 pb-24">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-green-300 bg-clip-text text-transparent">
                            Privacy Policy
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-10">Last updated: 31 May 2026</p>

                    <div className="space-y-8 text-slate-700 dark:text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Who we are</h2>
                            <p>
                                Predictaball.live (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a World Cup score predictor game operated in the United Kingdom. This policy explains how we collect, use, and protect your personal data under the UK GDPR and the Data Protection Act 2018.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What we collect</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Account details:</strong> your email address, your name, and a securely hashed password (or, if you sign in with Google, your Google account ID and the name and email Google shares with us).</li>
                                <li><strong>Game data:</strong> the score predictions you submit, the leagues you join or create, and your position on leaderboards.</li>
                                <li><strong>Technical data:</strong> standard server logs (IP address, request timestamps, user agent) used to operate and secure the service.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">How we use it</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>To create and manage your account and authenticate you when you sign in.</li>
                                <li>To run the prediction game, calculate scores, and display leaderboards to you and other players in your leagues.</li>
                                <li>To send you password reset emails when you request them, and &mdash; if you opt in &mdash; prediction reminder emails on match days when you have unpredicted matches. We use Resend as our email provider. You can turn reminders on or off at any time on your <Link href="/app/profile" className="text-cyan-600 dark:text-cyan-300 underline">profile page</Link>.</li>
                                <li>To keep the service secure and diagnose problems.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Lawful basis</h2>
                            <p>We rely on the following lawful bases under UK GDPR Article 6:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li><strong>Contract</strong> &mdash; to provide the service you signed up for, including password reset emails.</li>
                                <li><strong>Consent</strong> &mdash; to send prediction reminder emails. You give consent at signup or on your profile page, and you can withdraw it at any time.</li>
                                <li><strong>Legitimate interests</strong> &mdash; to keep the service secure and prevent abuse.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Sharing your data</h2>
                            <p>We do not sell your personal data. We share it only with the providers that help us run the service:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li><strong>Amazon Web Services (AWS)</strong> &mdash; hosts our application and database (region: eu-west-2, London).</li>
                                <li><strong>Google</strong> &mdash; if you choose to sign in with Google.</li>
                                <li><strong>Resend</strong> &mdash; sends transactional emails on our behalf.</li>
                            </ul>
                            <p className="mt-3">
                                Your name and predictions are visible to other signed-in members of any league you join, and your name may appear on the global leaderboard, which is visible to all signed-in users.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">How long we keep it</h2>
                            <p>
                                We keep your account and game data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to keep it for legal reasons.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Your rights</h2>
                            <p>Under UK GDPR you have the right to:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li>Access the personal data we hold about you.</li>
                                <li>Ask us to correct inaccurate data.</li>
                                <li>Ask us to delete your data (&ldquo;right to be forgotten&rdquo;).</li>
                                <li>Object to or restrict our processing of your data.</li>
                                <li>Receive a copy of your data in a portable format.</li>
                            </ul>
                            <p className="mt-3">
                                To exercise any of these rights, contact us at the email address below. You also have the right to lodge a complaint with the UK&apos;s data protection regulator, the <a href="https://ico.org.uk/" className="text-cyan-600 dark:text-cyan-300 underline" rel="noopener noreferrer" target="_blank">Information Commissioner&apos;s Office (ICO)</a>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Cookies</h2>
                            <p>
                                See our <Link href="/cookie-policy" className="text-cyan-600 dark:text-cyan-300 underline">Cookie Policy</Link> for details. In short: we only use strictly necessary cookies, and no analytics or advertising cookies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Children</h2>
                            <p>
                                Predictaball is not directed at children, and we do not knowingly collect data from anyone under 13.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Changes</h2>
                            <p>
                                We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top will tell you when. Significant changes will be highlighted on the site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Contact</h2>
                            <p>
                                For privacy questions or to exercise your rights, email <a href="mailto:privacy@predictaball.live" className="text-cyan-600 dark:text-cyan-300 underline">privacy@predictaball.live</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </section>

            <LegalFooter/>
        </main>
    )
}
