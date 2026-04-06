import React from "react";

export default function TicketSkeleton(): React.JSX.Element {
    return (
        <div className="w-full p-3">
            <div className="w-full max-w-xl mx-auto animate-pulse">
                <div className="h-6 w-48 bg-gray-700 rounded mb-3 mx-auto" />
                <div className="bg-gray-800 rounded-large p-4 space-y-3">
                    <div className="flex justify-around">
                        <div className="h-16 w-20 bg-gray-700 rounded" />
                        <div className="h-16 w-20 bg-gray-700 rounded" />
                    </div>
                    <div className="h-10 w-full bg-gray-700 rounded" />
                </div>
            </div>
        </div>
    )
}
