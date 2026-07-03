import React from "react"
import Link from "next/link"
import {Header} from "@/app/components/landing-header"

export const metadata = {
    title: "Cookie Policy | Predictaball.live",
    description: "How Predictaball uses cookies",
}

export default function CookiePolicy(): React.JSX.Element {
    return (
        <main className="bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white min-h-svh flex flex-col">
            <div className="p-10">
                <Header/>
            </div>

            <section className="flex-1 px-6 lg:px-10 pb-24">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2">
                        <span className="text-pitch-700 dark:text-pitch-300">
                            Cookie Policy
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-10">Last updated: 31 May 2026</p>

                    <div className="space-y-8 text-slate-700 dark:text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What are cookies?</h2>
                            <p>
                                Cookies are small text files that websites place on your device. They are widely used to make websites work, or work more efficiently, and to provide information to the site owner.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Our approach</h2>
                            <p>
                                Predictaball.live only uses cookies that are <strong>strictly necessary</strong> for the site to function. Under the UK Privacy and Electronic Communications Regulations (PECR), strictly necessary cookies do not require your consent, but we still want to be transparent about which ones we use and why.
                            </p>
                            <p className="mt-3">
                                We do not use any analytics, advertising, profiling, or third-party tracking cookies. If that ever changes, we will update this page and ask for your consent before placing any non-essential cookies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Cookies we set</h2>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 dark:bg-gray-800/60">
                                        <tr>
                                            <th className="text-left p-3 font-semibold">Cookie</th>
                                            <th className="text-left p-3 font-semibold">Purpose</th>
                                            <th className="text-left p-3 font-semibold">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                                        <tr>
                                            <td className="p-3 font-mono text-xs">authjs.session-token</td>
                                            <td className="p-3">Keeps you signed in to your account.</td>
                                            <td className="p-3">30 days</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-mono text-xs">authjs.csrf-token</td>
                                            <td className="p-3">Protects sign-in and sign-out requests against cross-site request forgery.</td>
                                            <td className="p-3">Session</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-mono text-xs">authjs.callback-url</td>
                                            <td className="p-3">Remembers where to send you back to after signing in.</td>
                                            <td className="p-3">Session</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">
                                These cookies are set by NextAuth.js, the authentication library we use.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Managing cookies</h2>
                            <p>
                                Because we only use strictly necessary cookies, blocking them will prevent you from signing in or using the site. You can clear or block cookies at any time through your browser settings — see your browser&apos;s help pages for details.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Contact</h2>
                            <p>
                                Questions about this policy? See our <Link href="/privacy-policy" className="text-pitch-700 dark:text-pitch-300 underline">Privacy Policy</Link> or get in touch through the email address listed there.
                            </p>
                        </section>
                    </div>
                </div>
            </section>
        </main>
    )
}
