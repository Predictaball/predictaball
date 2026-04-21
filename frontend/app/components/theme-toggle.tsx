'use client'

import React, {useEffect, useState} from "react"
import {useTheme} from "next-themes"

interface ThemeToggleProps {
    sizeClassName?: string
}

export default function ThemeToggle({sizeClassName = "h-[39px] w-[39px]"}: ThemeToggleProps = {}): React.JSX.Element {
    const {resolvedTheme, setTheme} = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    const isDark = mounted ? resolvedTheme === "dark" : true
    const label = isDark ? "Switch to light mode" : "Switch to dark mode"

    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`inline-flex ${sizeClassName} items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10`}
        >
            {mounted && (isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 3a1 1 0 0 1 .993.883L13 4v1a1 1 0 0 1-1.993.117L11 5V4a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 .993.883L13 19v1a1 1 0 0 1-1.993.117L11 20v-1a1 1 0 0 1 1-1zm8-7a1 1 0 0 1 .117 1.993L20 13h-1a1 1 0 0 1-.117-1.993L19 11h1zM5 11a1 1 0 0 1 .117 1.993L5 13H4a1 1 0 0 1-.117-1.993L4 11h1zm12.657-6.07a1 1 0 0 1 1.497 1.32l-.083.094-.707.707a1 1 0 0 1-1.497-1.32l.083-.094.707-.707zM6.464 16.536a1 1 0 0 1 1.497 1.32l-.083.094-.707.707a1 1 0 0 1-1.497-1.32l.083-.094.707-.707zM18.364 17.657a1 1 0 0 1 .083 1.497l-.083.083a1 1 0 0 1-1.497-.083l-.083-.083-.707-.707a1 1 0 0 1 1.32-1.497l.094.083.707.707zM7.05 5.343a1 1 0 0 1 .094 1.32l-.083.094-.707.707A1 1 0 0 1 4.836 5.98l.083-.094.707-.707a1 1 0 0 1 1.414 0zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14 11.69 1 1 0 0 0-.36-1.05z"/>
                </svg>
            ))}
        </button>
    )
}
