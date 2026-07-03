import React from "react"

interface LandingHeaderLoginButtonProps {
    buttonText?: string
}

export default function LandingHeaderLoginButton({buttonText = "Sign In"}: LandingHeaderLoginButtonProps) {
    return (
        <span className="group inline-flex items-center gap-1 rounded-md border-[1.5px] border-pitch-700 px-5 h-9 font-semibold tracking-wide whitespace-nowrap text-pitch-700 hover:bg-pitch-700 hover:text-white dark:border-pitch-300 dark:text-pitch-300 dark:hover:bg-pitch-300 dark:hover:text-gray-950 transition-colors">
            <span>{buttonText}</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
    )
}
