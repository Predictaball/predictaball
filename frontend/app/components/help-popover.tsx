'use client'

import React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react"

interface HelpPopoverProps {
    label: string
    children: React.ReactNode
}

export default function HelpPopover({ label, children }: HelpPopoverProps): React.JSX.Element {
    return (
        <Popover placement="bottom-end" showArrow>
            <PopoverTrigger>
                <button
                    type="button"
                    aria-label={label}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/5 text-slate-500 hover:bg-slate-900/10 hover:text-slate-700 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/15 dark:hover:text-gray-200 transition-colors text-xs font-bold"
                >
                    ?
                </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-xs px-4 py-3">
                <div className="space-y-3 text-sm text-slate-700 dark:text-gray-300">
                    <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                    {children}
                </div>
            </PopoverContent>
        </Popover>
    )
}
