import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@nextui-org/react"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { Configuration, GetLeaguePreview200Response, GetLeaguePreview200ResponseKindEnum, LeagueApi } from "@/client"
import { API_GATEWAY } from "@/app/api/constants"
import { BUTTON_CLASS, GHOST_BUTTON_CLASS } from "@/app/util/css-classes"
import JoinButton from "./join-button"

const PUBLIC_API = new LeagueApi(new Configuration({ basePath: API_GATEWAY }))

async function fetchPreview(leagueId: string): Promise<GetLeaguePreview200Response | null> {
    try {
        return await PUBLIC_API.getLeaguePreview({ leagueId })
    } catch {
        return null
    }
}

export async function generateMetadata({params}: {params: Promise<{leagueId: string}>}): Promise<Metadata> {
    const { leagueId } = await params
    const preview = await fetchPreview(leagueId)
    if (!preview || preview.kind !== GetLeaguePreview200ResponseKindEnum.User) {
        return {
            title: "Predictaball.live",
            description: "A score predictor for World Cup 2026",
        }
    }
    const memberLine = preview.memberCount === 1
        ? "1 predictor is already in"
        : `${preview.memberCount} predictors are already in`
    const title = `Join "${preview.name}" on Predictaball`
    const description = `${memberLine}. Pick a score, climb the leaderboard.`
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
        },
    }
}

// Tracking params some platforms append to shared links. They serve no purpose
// here and can interfere with client-side routing on some mobile browsers, so
// we strip them with a server-side redirect to the canonical URL.
const TRACKING_PARAMS = ["fbclid", "gclid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]

export default async function JoinLeagueInvite(
    {params, searchParams}: {
        params: Promise<{leagueId: string}>
        searchParams: Promise<Record<string, string | string[] | undefined>>
    },
): Promise<React.JSX.Element> {
    const { leagueId } = await params
    const resolvedSearchParams = await searchParams
    const hasTrackingParam = TRACKING_PARAMS.some(p => p in resolvedSearchParams)
    if (hasTrackingParam) {
        redirect(`/league/${leagueId}/join`)
    }

    const session = await auth()
    const isLoggedIn = !!session?.user

    const preview = await fetchPreview(leagueId)

    // Hidden case: someone hits this URL with a system league id. Bounce to /app.
    if (preview && preview.kind !== GetLeaguePreview200ResponseKindEnum.User) {
        redirect("/app")
    }

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
                    {preview ? (
                        <>
                            <span className="text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase">League invite</span>
                            <h1 className="mt-3 text-2xl font-black tracking-tight">
                                Join &ldquo;<span className="bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent">{preview.name}</span>&rdquo;
                            </h1>
                            <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">
                                {preview.memberCount === 1
                                    ? "1 predictor is already in. Pick a score, climb the leaderboard."
                                    : `${preview.memberCount} predictors are already in. Pick a score, climb the leaderboard.`}
                            </p>
                            {isLoggedIn ? (
                                <JoinButton leagueId={leagueId}/>
                            ) : (
                                <>
                                    <Button
                                        as={Link}
                                        href={`/login?callbackUrl=${encodeURIComponent(`/league/${leagueId}/join`)}`}
                                        radius="full"
                                        className={"mt-6 w-full " + BUTTON_CLASS}
                                    >
                                        Sign in to join
                                    </Button>
                                    <Button
                                        as={Link}
                                        href={`/login?callbackUrl=${encodeURIComponent(`/league/${leagueId}/join`)}`}
                                        radius="full"
                                        className={"mt-3 w-full " + GHOST_BUTTON_CLASS}
                                    >
                                        New here? Sign up
                                    </Button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-black tracking-tight">Couldn&apos;t find that league</h1>
                            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                                The invite link may be invalid or expired.
                            </p>
                            <Button as={Link} href="/" radius="full" className={"mt-6 w-full " + BUTTON_CLASS}>
                                Back to homepage
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
