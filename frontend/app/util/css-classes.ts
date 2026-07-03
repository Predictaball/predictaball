// ── Color tokens ───────────────────────────────────────────────────────────
// Single source of truth for the palette. To re-theme, change values here.
//
// The palette is flat and matchday-flavoured — no gradients. Roles (kept
// distinct so no colour does double duty):
//   brand     = pitch green (the custom `pitch` scale in tailwind.config)
//   positive  = emerald             (improved / gained)
//   negative  = rose                (worsened / lost)
//   live      = red                 (a match in play — broadcast red)
//   action    = amber               ("needs your attention now" / scoreboard amber)
//   warning   = amber
// Brand green is a deep grass green (600-700) so the brighter emerald can
// still mean "positive" without ambiguity.

// Brand text accent — flat pitch green.
export const BRAND_TEXT = "text-pitch-700 dark:text-pitch-300"

// Primary button: solid pitch green, hard-edged confidence — no glow, no scale.
export const BUTTON_CLASS = "bg-pitch-600 text-white font-bold hover:bg-pitch-500 dark:bg-pitch-400 dark:text-gray-950 dark:hover:bg-pitch-300 transition-colors"

export const GHOST_BUTTON_CLASS = "bg-slate-900/5 border border-slate-900/10 text-slate-700 hover:bg-slate-900/10 hover:border-pitch-600/40 dark:bg-white/5 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:border-pitch-400/40 transition-colors"

// Interactive / info accent (pitch green tint).
export const BRAND_GHOST_BUTTON_CLASS = "bg-pitch-600/10 border border-pitch-600/20 text-pitch-700 hover:bg-pitch-600/20 hover:border-pitch-600/40 dark:bg-pitch-400/10 dark:border-pitch-400/20 dark:text-pitch-300 dark:hover:bg-pitch-400/20 dark:hover:border-pitch-400/40 transition-colors"

// Warm "action needed" accent (amber) — pops against the green UI for calls-to-act.
export const ACTION_TINT = "border border-amber-500/20 bg-amber-500/10 dark:border-amber-400/20 dark:bg-amber-400/10"
export const ACTION_TEXT = "text-amber-600 dark:text-amber-300"
export const ACTION_DOT = "bg-amber-500 dark:bg-amber-400"
// Match-strip pill border for an unpredicted upcoming match.
export const ACTION_PILL_BORDER = "border-amber-500/70 hover:border-amber-500 dark:border-amber-400/70 dark:hover:border-amber-400"
// Primary call-to-action — solid scoreboard amber. Use for the single most
// important action on a surface.
export const ACTION_BUTTON_CLASS = "bg-amber-400 text-gray-950 font-bold hover:bg-amber-300 transition-colors"

// Broadcast-chyron tab: the solid lower-third label used for section headings
// and row headers. White-on-green block, condensed caps, square corners.
export const CHYRON_TAB = "inline-flex items-center w-fit bg-pitch-700 text-white dark:bg-pitch-400 dark:text-gray-950 px-2.5 py-1 rounded-sm font-display text-sm font-bold uppercase tracking-[0.18em] leading-none"

// Podium treatment for the top three leaderboard places — newspaper league
// table, not neon: a solid metallic left rule plus a quiet tint. Gold, then
// silver, then bronze.
export const PODIUM_ROW: Record<1 | 2 | 3, string> = {
    1: "border-l-[3px] border-l-amber-400 bg-amber-400/10 dark:border-l-amber-300 dark:bg-amber-300/10",
    2: "border-l-[3px] border-l-slate-400 bg-slate-400/10 dark:border-l-slate-300 dark:bg-slate-300/10",
    3: "border-l-[3px] border-l-orange-600 bg-orange-600/10 dark:border-l-orange-400 dark:bg-orange-400/10",
}

// Semantic chips (border + tint + text), used for leaderboard movement etc.
export const POSITIVE_CHIP = "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/30"
export const NEGATIVE_CHIP = "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:bg-rose-400/15 dark:text-rose-300 dark:border-rose-400/30"
export const NEUTRAL_CHIP = "bg-slate-900/5 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"

export const SECTION_EYEBROW = "font-display text-sm font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-gray-300"

export const AUTH_INPUT_CLASS_NAMES = {
    label: "text-slate-600 dark:text-gray-300 group-data-[filled-within=true]:text-pitch-700 dark:group-data-[filled-within=true]:text-pitch-300",
    input: "text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500",
    inputWrapper: [
        "bg-white",
        "border border-slate-200",
        "hover:bg-slate-50",
        "group-data-[focus=true]:bg-slate-50",
        "group-data-[focus=true]:border-pitch-600",
        "dark:bg-white/5",
        "dark:border-white/10",
        "dark:hover:bg-white/10",
        "dark:group-data-[focus=true]:bg-white/10",
        "dark:group-data-[focus=true]:border-pitch-400",
        "shadow-none",
    ].join(" "),
}
