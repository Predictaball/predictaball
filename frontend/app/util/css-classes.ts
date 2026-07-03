// ── Color tokens ───────────────────────────────────────────────────────────
// Single source of truth for the palette. To re-theme, change values here.
//
// Roles (kept distinct so no colour does double duty):
//   brand     = blue → indigo → violet  (gradient + indigo for interactive/info)
//   positive  = emerald             (improved / gained)
//   negative  = rose                (worsened / lost)
//   live      = red                 (a match in play)
//   action    = amber               ("needs your attention now")
//   warning   = amber
// Green is intentionally NOT part of the brand gradient so it can mean
// "positive" everywhere without ambiguity.
//
// NOTE: the `cyan-*` / `teal-*` utilities below (and throughout the app) are
// re-pointed at indigo / violet in tailwind.config.ts, so they render as the
// deeper brand band rather than literal cyan. New code can use `indigo-*` /
// `violet-*` directly — they resolve to the same values.

// Brand gradient stops — blue → indigo → violet (cool, green-free, deliberate).
export const BRAND_GRADIENT = "from-blue-500 via-cyan-400 to-teal-300"
export const BRAND_TEXT_GRADIENT = `bg-gradient-to-r ${BRAND_GRADIENT} bg-clip-text text-transparent`

export const BUTTON_CLASS = `bg-gradient-to-r ${BRAND_GRADIENT} text-white font-semibold shadow-lg shadow-indigo-500/25 transition duration-200 hover:brightness-110`

export const GHOST_BUTTON_CLASS = "bg-slate-900/5 border border-slate-900/10 text-slate-700 hover:bg-slate-900/10 hover:border-cyan-500/40 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-cyan-400/40 transition-colors"

// Interactive / info accent (indigo — the `cyan-*` here renders as indigo).
export const BRAND_GHOST_BUTTON_CLASS = "bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 hover:bg-cyan-500/20 hover:border-cyan-500/40 dark:bg-cyan-400/10 dark:border-cyan-400/20 dark:text-cyan-300 dark:hover:bg-cyan-400/20 dark:hover:border-cyan-400/40 transition-colors"

// Warm "action needed" accent (amber) — pops against the cool UI for calls-to-act.
export const ACTION_TINT = "border border-amber-500/20 bg-amber-500/10 dark:border-amber-400/20 dark:bg-amber-400/10"
export const ACTION_TEXT = "text-amber-600 dark:text-amber-300"
export const ACTION_DOT = "bg-amber-500 dark:bg-amber-400"
// Match-strip pill border for an unpredicted upcoming match.
export const ACTION_PILL_BORDER = "bg-amber-500/40 hover:bg-amber-500/60 dark:bg-amber-400/40 dark:hover:bg-amber-400/60"
// Primary call-to-action — solid warm amber/orange that pops against the cool
// brand UI. Use for the single most important action on a surface.
export const ACTION_BUTTON_CLASS = "bg-gradient-to-r from-amber-400 to-orange-500 text-gray-950 font-bold shadow-lg shadow-orange-500/25 transition duration-200 hover:brightness-105"

// Podium glows for the top three leaderboard places. Each value is the
// gradient "border" (revealed by the row's 1px padding) plus a coloured glow
// shadow. Gold is intentionally the most prominent — biggest, brightest glow —
// with silver and bronze progressively subtler. Warm metallics chosen to read
// as a podium while still sitting happily next to the cool brand gradient.
export const PODIUM_GLOW: Record<1 | 2 | 3, string> = {
    1: "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 shadow-[0_0_28px_-2px_rgba(251,191,36,0.75)] dark:shadow-[0_0_32px_-2px_rgba(251,191,36,0.65)]",
    2: "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 dark:from-slate-200 dark:via-gray-300 dark:to-slate-400 shadow-[0_0_18px_-3px_rgba(100,116,139,0.55)] dark:shadow-[0_0_18px_-4px_rgba(203,213,225,0.5)]",
    3: "bg-gradient-to-r from-orange-300 via-amber-600 to-orange-700 shadow-[0_0_16px_-4px_rgba(217,119,6,0.6)] dark:shadow-[0_0_18px_-4px_rgba(234,88,12,0.55)]",
}

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
