import React from "react"

interface LandingHeaderLoginButtonProps {
    buttonText?: string
}

export default function LandingHeaderLoginButton({buttonText = "Sign In"}: LandingHeaderLoginButtonProps) {
    return (
        <div className="group relative inline-flex rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-green-300 p-[1.5px] shadow-lg shadow-cyan-500/10 transition-all hover:shadow-cyan-500/30 hover:scale-105">
            <span className="rounded-full bg-gray-900 font-semibold tracking-wide px-5 h-9 min-w-0 group-hover:bg-gray-900/80 inline-flex items-center gap-1">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-green-300 bg-clip-text text-transparent">
                    {buttonText}
                </span>
                <span className="text-cyan-300 transition-transform group-hover:translate-x-0.5">→</span>
            </span>
        </div>
    )
}
