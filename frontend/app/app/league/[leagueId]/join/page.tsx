import {LeagueApi} from "@/client";
import {getConfigWithAuthHeader} from "@/app/api/client-config";
import {redirect} from "next/navigation";
import { Button, Link } from "@nextui-org/react";
import { BUTTON_CLASS } from "@/app/util/css-classes";
import { isLoggedIn } from "@/app/auth/jtw-handler";

export default async function Home({params}: { params: { leagueId: string } }) {
    const loggedIn = await isLoggedIn()
    if (!loggedIn) redirect(`/login?leagueId=${params.leagueId}`)
    
    let joined = false
    
    try {
        const leagueApi = new LeagueApi(await getConfigWithAuthHeader())
        await leagueApi.joinLeague({ leagueId: params.leagueId })
        joined = true
    } catch (error) {
        console.log(error)
    }

    if (joined) redirect(`/app/league/${params.leagueId}/leaderboard`)

    return (
        <main className="flex min-h-screen flex-col items-center justify-between bg-gray-900">
            <p className="text-xl font-bold mt-4 text-white">PREDICTABALL</p>
            <div className="max-w-3xl absolute text-center pt-40 text-white m-20">
                Error Joining {params.leagueId}, refresh to try again.
                <div>
                    <Link href="/app"><Button size="sm" className={"mt-10 " + BUTTON_CLASS}>Back to App</Button></Link>
                </div>
            </div>
        </main>
    )
}
