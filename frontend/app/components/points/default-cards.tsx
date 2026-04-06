import React from "react";

export default function DefaultCards(): React.JSX.Element {
    return (
        <div className="w-full max-w-screen-lg mx-auto">
            <div className="w-full flex mt-1 max-w-xl items-center text-center justify-around p-2 mx-auto">
                <div className="w-1/5">
                    <div className="flex-row">
                        <div className="font-bold text-white mb-1">Position</div>
                        <div className="text-3xl rounded bg-gray-100 h-14 content-center animate-pulse">
                        </div>
                    </div>
                </div>
                <div className="w-1/3">
                    <div className="flex-row">
                        <div className="font-bold text-white mb-1">Points</div>
                        <div className="text-5xl rounded bg-gray-100 h-24 content-center animate-pulse"></div>
                    </div>
                </div>
                <div className="w-1/5">
                    <div className="flex-row">
                        <div className="font-bold text-white mb-1">Live</div>
                        <div className="text-3xl rounded bg-gray-100 h-14 content-center animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
