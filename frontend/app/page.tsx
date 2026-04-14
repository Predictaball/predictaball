import React from "react";
import AnimatedFlags from "@/app/components/flags/animated-flags";
import {Header} from "@/app/components/landing-header";

export default async function Home(): Promise<React.JSX.Element> {

    function getFlags(): React.JSX.Element[] {
        return [
            <AnimatedFlags bottom="70%" invert={false} hostCountries={true} key={0} />,
            <AnimatedFlags bottom="80%" invert={true} hostCountries={true} key={1} />,
            <AnimatedFlags bottom="20%" invert={false} key={2} />,
            <AnimatedFlags bottom="10%" invert={true} key={3} className="hidden lg:block" />
        ]
    }

    return (
        <main className="bg-gray-900 text-white overflow-auto">
            <section className="relative flex flex-col items-center justify-center p-10 h-svh overflow-hidden">
                <div className="absolute top-0 left-0 right-0 p-10">
                    <Header/>
                </div>
                <div className="w-full max-w-[800px] text-center z-40 -mt+140">
                    <div className="text-6xl lg:text-8xl font-bold leading-tight">
                        FOOTBALL
                    </div>
                    <div className="text-6xl lg:text-8xl font-bold leading-tight">
                        JUST GOT
                    </div>
                    <div className="text-7xl lg:text-9xl font-bold leading-tight bg-gradient-to-r from-blue-600 to-green-300 inline-block text-transparent bg-clip-text">
                        FUNNER
                    </div>
                </div>
                {getFlags()}
                <div className="absolute bottom-10 text-xl text-gray-300 z-40">
                    World Cup 2026 Score Predictor
                </div>
            </section>

            <section className="flex flex-col items-center px-10 py-20 min-h-svh">
                <div className="max-w-4xl w-full">
                    <h2 className="text-5xl lg:text-6xl font-bold mb-16 text-center">ABOUT</h2>
                    
                    <div className="space-y-8 text-lg text-gray-300">
                        <p className="text-center text-xl">
                            Predictaball is a game where you are challenged to predict the scores of <span className="font-bold text-white">every</span> game that takes place during World Cup 2026 &#9917;
                        </p>
                        <p className="text-center">
                            The better your predictions are, the more points you will receive &#128175;
                        </p>
                        <p className="text-center">
                            Upcoming games will be displayed for the next 2 match days, come back each day to submit your predictions
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 mt-20">
                        <div className="text-center">
                            <h3 className="text-3xl font-bold mb-4">THE PRIZE</h3>
                            <p className="text-gray-300">Bragging rights &#128526;</p>
                        </div>

                        <div className="text-center">
                            <h3 className="text-3xl font-bold mb-4">LEAGUES</h3>
                            <p className="text-gray-300">Create leagues and invite friends if you want to stake a prize or come up with some forfeits &#127942;</p>
                        </div>

                        <div className="text-center">
                            <h3 className="text-3xl font-bold mb-4">SCORING</h3>
                            <p className="text-gray-300">5 points for a correct score &#129306;</p>
                            <p className="text-gray-300 mt-2">2 points for a correct result &#9996;</p>
                            <p className="text-gray-300 mt-4 text-sm">&#10024; Look out for an updated scoring system during knockout games &#10024;</p>
                        </div>
                    </div>

                    <div className="text-center mt-20">
                        <p className="text-3xl font-bold">READY TO PLAY?</p>
                        <p className="text-xl text-gray-300 mt-4">Sign up now and start predicting!</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
