import React from "react";
import {Header} from "@/app/components/landing-header";
import {isLoggedIn} from "@/app/auth/jtw-handler";

export default async function MoreInfo(): Promise<React.JSX.Element> {

    const loggedIn = await isLoggedIn()
    const headerButtonValue = loggedIn ? "Go to App" : "Sign In"

    return(
        <main
            className="bg-gray-900 flex flex-col items-center p-10 min-h-svh overflow-auto text-white">
            <Header buttonText={headerButtonValue}/>
            <div className="max-w-3xl text-center lg:pt-20 pt-20">
                <p className="text-2xl">About</p>
                <p>Predictaball is a game where you are challenged to predict the scores of <span className="font-bold">every</span> game that
                takes place during Euro 2024 &#9917;</p>
                <p>The better your predictions are, the more points you will receive &#128175;</p>
                
                <p>Upcoming games will be displayed for the next 2 match days, come back each day to submit your predictions</p>
                <p className="pt-10 text-2xl">The Prize</p>
                <p>Bragging rights &#128526;</p>

                <p className="pt-10 text-2xl">Leagues</p>
                <p>Create leagues and invite friends if you want to stake a prize or come up with some forfeits &#127942;</p>

                <p className="pt-10 text-2xl">Scoring</p>
                <p>5 points for a correct score &#129306;</p>
                <p>2 points for a correct result &#9996;</p>
                <p>&#10024; Look out for an updated scoring system during knockout games &#10024;</p>

                <p className="pt-10 text-xl">Sign up now and start predicting!</p>
            </div>
        </main>
    )
}