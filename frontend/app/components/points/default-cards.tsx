import React from "react"

export default function DefaultCards(): React.JSX.Element {
    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {["Position", "Points", "Live"].map((label, i) => (
                <div key={label} className="rounded-2xl bg-gradient-to-br from-white/15 to-white/5 p-[1px]">
                    <div className="rounded-2xl bg-gray-900/80 backdrop-blur-sm px-3 sm:px-5 py-4 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                            {label}
                        </div>
                        <div className={`${i === 1 ? "h-10 sm:h-12 w-20" : "h-7 sm:h-8 w-12"} rounded-md bg-white/10 animate-pulse`}/>
                    </div>
                </div>
            ))}
        </div>
    )
}
