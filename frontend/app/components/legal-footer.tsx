import React from "react"
import Link from "next/link"

export default function LegalFooter(): React.JSX.Element {
    return (
        <footer className="border-t border-slate-200 dark:border-gray-800 px-6 lg:px-10 py-6">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500 dark:text-gray-400">
                <span>&copy; {new Date().getFullYear()} Predictaball.live</span>
                <div className="flex items-center gap-5">
                    <Link href="/cookie-policy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                        Cookies
                    </Link>
                    <Link href="/privacy-policy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                        Privacy
                    </Link>
                </div>
            </div>
        </footer>
    )
}
