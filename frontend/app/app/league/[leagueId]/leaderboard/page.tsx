import React from "react";
import Leaderboard from "@/app/components/leaderboard/leaderboard";
import Share from "./share";
import {isLoggedIn} from "@/app/auth/jtw-handler";
import {redirect} from "next/navigation";
import Leave from "./leave";
import BackButton from "@/app/components/back-button";


export default async function Home({ params }: { params: { leagueId: string } }): Promise<React.JSX.Element> {
    const loggedIn = await isLoggedIn()
    if (!loggedIn) redirect("/login")

    return (
        <div className="min-h-svh bg-gray-900">
            <div className="w-full max-w-4xl mx-auto relative">
                <div className="flex justify-between p-4">
                    <div>
                        <BackButton/>
                    </div>
                    <div className="flex justify-around">
                        <Leave leagueId={params.leagueId}/>
                        <Share leagueId={params.leagueId} />
                    </div>
                </div>
                <div className="p-2 w-full bg-gray-900 flex flex-col items-center">
                    <Leaderboard shouldPaginate={true} leagueId={params.leagueId} limit={false} />
                </div>
            </div>
        </div>
    );
}
