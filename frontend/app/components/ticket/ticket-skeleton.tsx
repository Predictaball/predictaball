import React from "react";

export default function TicketSkeleton(): React.JSX.Element {
    return (
        <div className="w-full p-3">
            <div className="w-full max-w-xl mx-auto animate-pulse">
                <div className="h-6 w-48 bg-slate-200 dark:bg-gray-700 rounded mb-3 mx-auto" />
                <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-transparent rounded-large p-4 space-y-3">
                    <div className="flex justify-around">
                        <div className="h-16 w-20 bg-slate-200 dark:bg-gray-700 rounded" />
                        <div className="h-16 w-20 bg-slate-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="h-10 w-full bg-slate-200 dark:bg-gray-700 rounded" />
                </div>
            </div>
        </div>
    )
}
