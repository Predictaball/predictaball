import React from "react";

export default function DefaultCards(): React.JSX.Element {
    return (
        <div className="w-full flex mt-1 items-center text-center justify-around p-2">
            <div className="w-1/5">
                <div className="flex-row">
                    <div className="font-bold text-white mb-1">Position</div>
                    <div className="text-3xl rounded bg-gray-100 h-14 content-center">
                        ...
                    </div>
                </div>
            </div>
            <div className="w-1/3">
                <div className="flex-row">
                    <div className="font-bold text-white mb-1">Points</div>
                    <div className="text-5xl rounded bg-gray-100 h-24 content-center">0</div>
                </div>
            </div>
            <div className="w-1/5">
                <div className="flex-row">
                    <div className="font-bold text-white mb-1">Live</div>
                    <div className="text-3xl rounded bg-gray-100 h-14 content-center">0</div>
                </div>
            </div>
        </div>
    )
}