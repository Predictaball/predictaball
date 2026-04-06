import React from "react";

export default function LeaderboardSkeleton(): React.JSX.Element {
    return (
        <div className="w-full p-5 animate-pulse">
            <div className="h-6 w-32 bg-gray-700 rounded mb-3 mx-auto" />
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full max-w-md mx-auto bg-gray-800 rounded mb-2" />
            ))}
        </div>
    )
}
