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

// Lighter cyan stop, reserved for the wordmark and single-word emphasis in
// headings/body copy (a brighter, thinner-looking gradient reads better than
// BRAND_TEXT_GRADIENT at those sizes). Deliberately a separate constant from
// BRAND_GRADIENT rather than a shade of it — keep the two in sync only if a
// future rebrand wants them to match.
export const BRAND_TEXT_GRADIENT_LIGHT = "bg-gradient-to-r from-blue-500 via-cyan-300 to-teal-300 bg-clip-text text-transparent"

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
// Primary call-to-action — solid warm amber/orange that pops against the cool
// brand UI. Use for the single most important action on a surface.
export const ACTION_BUTTON_CLASS = "bg-gradient-to-r from-amber-400 to-orange-500 text-gray-950 font-bold shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.01]"

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

// A brighter, cyan-toned eyebrow for hero/marketing copy (landing page,
// onboarding), distinct from SECTION_EYEBROW's neutral in-app label style.
export const EYEBROW_CYAN = "text-xs font-semibold tracking-[0.3em] text-cyan-600/90 dark:text-cyan-300/80 uppercase"

// ── Text tokens ────────────────────────────────────────────────────────────
export const TEXT_PRIMARY = "text-slate-900 dark:text-white"
export const CARD_TITLE = "text-2xl font-bold text-slate-900 dark:text-white mb-3"
export const MODAL_TITLE = "text-2xl font-black tracking-tight"
export const FEATURE_CARD_TITLE = "text-xl font-bold mb-2 tracking-tight"

// "View all →" / "Standings →" style inline links.
export const CYAN_LINK = "text-xs font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 transition-colors"

// Underlined inline link within body copy (legal pages, help text).
export const LINK_UNDERLINE = "text-cyan-600 dark:text-cyan-300 underline"

// ── Page chrome ────────────────────────────────────────────────────────────
// The ambient background wash rendered behind every top-level page's content
// column. Centralised (see PageShell) so retuning the app's atmosphere is a
// one-line change instead of an N-file find-and-replace.
export const AMBIENT_GLOW = "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_60%)]"

// A punchier variant of AMBIENT_GLOW for the create/join league modals, which
// are smaller and want a more saturated wash than a full page.
export const MODAL_AMBIENT_GLOW = "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.08),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.22),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.14),transparent_65%)]"

// ── Tables ─────────────────────────────────────────────────────────────────
export const TABLE_HEADER_CELL = "py-1.5 px-1 text-center font-semibold w-7"
export const TABLE_HEADER_CELL_HIDDEN_SM = `${TABLE_HEADER_CELL} hidden sm:table-cell`
export const TABLE_CELL_CENTER = "py-2 px-1 text-center tabular-nums text-slate-600 dark:text-gray-300"
export const TABLE_CELL_CENTER_HIDDEN_SM = `${TABLE_CELL_CENTER} hidden sm:table-cell`

// ── Pills ──────────────────────────────────────────────────────────────────
export const GLASS_PILL = "rounded-full bg-white/80 border border-slate-200 text-slate-600 dark:bg-black/50 dark:border-white/10 dark:text-gray-300 px-3 py-1 text-xs backdrop-blur"
export const GLASS_PILL_BOLD = "inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 text-slate-700 dark:bg-black/50 dark:border-white/10 dark:text-gray-200 px-3 py-1 text-xs font-semibold backdrop-blur"

// A live match indicator dot.
export const LIVE_DOT = "h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"

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
