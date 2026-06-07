import {LeagueApi} from "@/client";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {redirect} from "next/navigation";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import { BUTTON_CLASS } from "@/app/util/css-classes";
import { isManagedLeague } from "@/app/util/leagues";

export default async function Home({params}: { params: Promise<{ leagueId: string }> }) {
    const { leagueId } = await params

    let joined = false

    try {
        const leagueApi = new LeagueApi(await getConfigWithAuthHeader())
        const league = await leagueApi.getLeague({ leagueId })
        // Managed leagues (global + country) are assigned automatically and can't be joined.
        if (isManagedLeague(league.kind)) redirect("/app")
        await leagueApi.joinLeague({ leagueId: leagueId })
        joined = true
    } catch (error) {
        console.log(error)
    }

    if (joined) redirect(`/app/league/${leagueId}/leaderboard`)

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-x-hidden px-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"/>

            <Link href="/" className="relative flex items-baseline font-black tracking-tight text-2xl mb-8">
                <span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">predicta</span>
                <span className="text-slate-900 dark:text-white">ball</span>
                <span className="ml-0.5 text-xs font-medium tracking-[0.2em] text-slate-500 dark:text-gray-400">.LIVE</span>
            </Link>

            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/15 to-slate-900/5 dark:from-white/15 dark:to-white/5 p-[1px] shadow-xl shadow-slate-900/5">
                <div className="rounded-3xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-8 text-center">
                    <h1 className="text-xl font-black tracking-tight">Couldn&apos;t join that league</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                        We couldn&apos;t add you to <span className="font-semibold text-slate-700 dark:text-gray-200">{leagueId}</span>. The link may be invalid — refresh to try again.
                    </p>
                    <Link href="/app">
                        <Button radius="full" className={"mt-6 w-full " + BUTTON_CLASS}>Back to App</Button>
                    </Link>
                </div>
            </div>
        </main>
    )
}
