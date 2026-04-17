import React from "react";

export default function LeaderboardSkeleton(): React.JSX.Element {
    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="h-4 w-32 bg-slate-900/10 dark:bg-white/10 rounded mb-4 mx-auto animate-pulse" />
            <div className="space-y-2.5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-slate-900/10 dark:bg-white/10 p-[1px]">
                        <div className="h-12 rounded-2xl bg-white dark:bg-gray-900/80 animate-pulse"/>
                    </div>
                ))}
            </div>
        </div>
    )
}
