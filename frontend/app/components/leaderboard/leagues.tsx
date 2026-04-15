import React from "react";
import JoinLeague from "@/app/app/league/join";
import CreateLeague from "@/app/app/league/create";
import YourLeaguesFetch from "@/app/components/leaderboard/your-leagues-fetch";

export default function Leagues(): React.JSX.Element {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-3">
            <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                <span>League</span>
                <span>Position</span>
            </div>
            <YourLeaguesFetch/>
            <div className="grid grid-cols-2 gap-3 pt-2">
                <CreateLeague/>
                <JoinLeague/>
            </div>
        </div>
    )
}
