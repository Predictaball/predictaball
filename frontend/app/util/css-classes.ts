// ── Color tokens ───────────────────────────────────────────────────────────
// Single source of truth for the palette. To re-theme, change values here.
//
// Roles (kept distinct so no colour does double duty):
//   brand     = blue → cyan → teal  (gradient + cyan for interactive/info)
//   positive  = emerald             (improved / gained)
//   negative  = rose                (worsened / lost)
//   live      = red                 (a match in play)
//   action    = amber               ("needs your attention now")
//   warning   = amber
// Green is intentionally NOT part of the brand gradient so it can mean
// "positive" everywhere without ambiguity.

// Brand gradient stops (cool, green-free).
export const BRAND_GRADIENT = "from-blue-500 via-cyan-400 to-teal-300"
export const BRAND_TEXT_GRADIENT = `bg-gradient-to-r ${BRAND_GRADIENT} bg-clip-text text-transparent`

export const BUTTON_CLASS = `bg-gradient-to-r ${BRAND_GRADIENT} text-gray-900 font-semibold shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]`

export const GHOST_BUTTON_CLASS = "bg-slate-900/5 border border-slate-900/10 text-slate-700 hover:bg-slate-900/10 hover:border-cyan-500/40 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-cyan-400/40 transition-colors"

// Interactive / info accent (cyan).
export const BRAND_GHOST_BUTTON_CLASS = "bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 hover:bg-cyan-500/20 hover:border-cyan-500/40 dark:bg-cyan-400/10 dark:border-cyan-400/20 dark:text-cyan-300 dark:hover:bg-cyan-400/20 dark:hover:border-cyan-400/40 transition-colors"

// Warm "action needed" accent (amber) — pops against the cool UI for calls-to-act.
export const ACTION_TINT = "border border-amber-500/20 bg-amber-500/10 dark:border-amber-400/20 dark:bg-amber-400/10"
export const ACTION_TEXT = "text-amber-600 dark:text-amber-300"
export const ACTION_DOT = "bg-amber-500 dark:bg-amber-400"
// Match-strip pill border for an unpredicted upcoming match.
export const ACTION_PILL_BORDER = "bg-amber-500/40 hover:bg-amber-500/60 dark:bg-amber-400/40 dark:hover:bg-amber-400/60"

// Semantic chips (border + tint + text), used for leaderboard movement etc.
export const POSITIVE_CHIP = "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/30"
export const NEGATIVE_CHIP = "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:bg-rose-400/15 dark:text-rose-300 dark:border-rose-400/30"
export const NEUTRAL_CHIP = "bg-slate-900/5 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"

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
