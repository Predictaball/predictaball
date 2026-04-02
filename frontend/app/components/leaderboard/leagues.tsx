import React, {Suspense} from "react";
import JoinLeague from "@/app/app/league/join";
import CreateLeague from "@/app/app/league/create";
import YourLeaguesFetch from "@/app/components/leaderboard/your-leagues-fetch";
import LeagueComponent from "@/app/components/leaderboard/league";

export default function Leagues(): React.JSX.Element {
    return (
        <div className="w-full mx-auto">
            <div className="w-full max-w-2xl p-4 mb-2 text-center mx-auto">
                <span className="text-white font-bold text-l">Your Leagues</span>
                <div className="w-full flex">
                    <div className="flex w-full justify-around rounded-3xl p-2 text-white">
                        <div className="w-2/3 font-bold">League Name</div>
                        <div className="w-1/3">
                            <span className="font-bold">Position</span>
                        </div>
                    </div>
                </div>
                <YourLeaguesFetch/>
                <div className="flex justify-around">
                    <CreateLeague/>
                    <JoinLeague/>
                </div>
            </div>
        </div>
    )
}