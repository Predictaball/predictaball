export const BUTTON_CLASS = "bg-gradient-to-r from-blue-600 via-cyan-400 to-green-300 text-gray-900 font-semibold shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"

export const GHOST_BUTTON_CLASS = "bg-slate-900/5 border border-slate-900/10 text-slate-700 hover:bg-slate-900/10 hover:border-cyan-500/40 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-cyan-400/40 transition-colors"

export const SECTION_EYEBROW = "text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400"

export const AUTH_INPUT_CLASS_NAMES = {
    label: "text-slate-600 dark:text-gray-300 group-data-[filled-within=true]:text-cyan-600 dark:group-data-[filled-within=true]:text-cyan-300",
    input: "text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500",
    inputWrapper: [
        "bg-white",
        "border border-slate-200",
        "hover:bg-slate-50",
        "group-data-[focus=true]:bg-slate-50",
        "group-data-[focus=true]:border-cyan-500",
        "dark:bg-white/5",
        "dark:border-white/10",
        "dark:hover:bg-white/10",
        "dark:group-data-[focus=true]:bg-white/10",
        "dark:group-data-[focus=true]:border-cyan-400",
        "shadow-none",
    ].join(" "),
}
