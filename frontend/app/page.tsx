import React from "react";
import AnimatedFlags from "@/app/components/flags/animated-flags";
import {Header} from "@/app/components/landing-header";
import {Button} from "@nextui-org/react";
import {BUTTON_CLASS} from "@/app/util/css-classes";
import Link from "next/link";

export default async function Home(): Promise<React.JSX.Element> {

    function getFlags(): React.JSX.Element[] {
        return Array.from(Array(3).keys())
            .map(i => <AnimatedFlags
                bottom={`${(i * 10) + 20}%`}
                invert={i % 2 == 0}
                key={i}
            />)
    }

    return (
        <main
            className="bg-gray-900 flex flex-col items-center justify-between p-10 h-svh overflow-hidden text-white">
            <Header/>
            <div className="w-full absolute text-center z-40">
                <div className="relative top-0 text-6xl lg:mt-40 mt-30 pt-20">
                    Football Just Got <p
                    className="bg-gradient-to-r from-blue-600 to-green-300 inline-block text-transparent bg-clip-text">Funner</p>
                </div>
                <div>
                    A Euro 2024 Score Predictor.
                </div>
            </div>

            {getFlags()}

            <div>
                <Link href="/info">
                    <Button
                        className={BUTTON_CLASS}>
                        Find Out More
                    </Button>
                </Link>
            </div>
        </main>
    );
}
