import React from "react"

interface LandingHeaderLoginButtonProps {
    buttonText?: string
}

export default function LandingHeaderLoginButton({buttonText = "Sign In"}: LandingHeaderLoginButtonProps) {
    return (
        <div className="group relative inline-flex rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-300 p-[1.5px] shadow-lg shadow-indigo-500/10 transition-all hover:shadow-indigo-500/30">
            <span className="rounded-full bg-white dark:bg-gray-900 font-semibold tracking-wide whitespace-nowrap px-5 h-9 min-w-0 group-hover:bg-slate-100 dark:group-hover:bg-gray-900/80 inline-flex items-center gap-1">
                <span className="text-indigo-600 dark:text-indigo-400">
                    {buttonText}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 transition-transform group-hover:translate-x-0.5">→</span>
            </span>
        </div>
    )
}
