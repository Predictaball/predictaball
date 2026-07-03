import React from "react"

/**
 * Football-pitch background motif: the markings tilted into a receding stadium
 * floor behind hero content. Drop <PitchPerspective/> inside any `relative`
 * surface (it fills its positioned parent) and content above it appears to stand
 * on the pitch.
 *
 * Two separate implementations, swapped at the `md` breakpoint:
 *   - DesktopPitch: landscape (goals left/right) — the wide-screen version.
 *   - MobilePitch:  portrait (recedes away from the viewer) — fits tall phones,
 *     where a landscape pitch would just crop its boxes off the sides.
 */

const FLOOR_MASK = "linear-gradient(to top, rgba(0,0,0,0.95), transparent 72%)"

// Mowing stripes: the alternating light/dark grass bands a groundskeeper's
// mower leaves. Runs goal-to-goal (horizontal bands on desktop's landscape
// pitch, vertical on mobile's portrait one) beneath the chalk markings.
const STRIPES_DESKTOP = "repeating-linear-gradient(to top, rgba(38,130,75,0.055) 0 85px, transparent 85px 170px)"
const STRIPES_MOBILE = "repeating-linear-gradient(to right, rgba(38,130,75,0.055) 0 85px, transparent 85px 170px)"

export function PitchPerspective(): React.JSX.Element {
    return (
        <>
            <MobilePitch/>
            <DesktopPitch/>
        </>
    )
}

// ── Desktop: landscape stadium floor ─────────────────────────────────────────
function DesktopPitch(): React.JSX.Element {
    return (
        <div
            aria-hidden
            className="hidden md:block pointer-events-none absolute inset-0 overflow-hidden"
            style={{perspective: "1000px"}}
        >
            <div
                className="absolute bottom-0 left-1/2 h-[85%] w-[150%]"
                style={{
                    transform: "translateX(-50%) rotateX(64deg)",
                    transformOrigin: "bottom center",
                    maskImage: FLOOR_MASK,
                    WebkitMaskImage: FLOOR_MASK,
                    backgroundImage: STRIPES_DESKTOP,
                }}
            >
                <svg
                    aria-hidden
                    viewBox="0 0 1050 680"
                    preserveAspectRatio="xMidYMid slice"
                    className="pointer-events-none absolute inset-0 h-full w-full text-slate-900/[0.09] dark:text-white/[0.10]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <rect x="20" y="20" width="1010" height="640" />
                    <line x1="525" y1="20" x2="525" y2="660" />
                    <circle cx="525" cy="340" r="91.5" />
                    <circle cx="525" cy="340" r="4" fill="currentColor" stroke="none" />

                    {/* Left end */}
                    <rect x="20" y="138.5" width="165" height="403" />
                    <rect x="20" y="248.5" width="55" height="183" />
                    <circle cx="130" cy="340" r="4" fill="currentColor" stroke="none" />
                    <path d="M185 266.9 A 91.5 91.5 0 0 1 185 413.1" />

                    {/* Right end */}
                    <rect x="865" y="138.5" width="165" height="403" />
                    <rect x="975" y="248.5" width="55" height="183" />
                    <circle cx="920" cy="340" r="4" fill="currentColor" stroke="none" />
                    <path d="M865 266.9 A 91.5 91.5 0 0 0 865 413.1" />
                </svg>
            </div>
        </div>
    )
}

// ── Mobile: portrait pitch receding away ─────────────────────────────────────
function MobilePitch(): React.JSX.Element {
    return (
        <div
            aria-hidden
            className="md:hidden pointer-events-none absolute inset-0 overflow-hidden"
            style={{perspective: "1000px"}}
        >
            <div
                className="absolute inset-x-0 bottom-0 h-[88%]"
                style={{
                    transform: "rotateX(60deg)",
                    transformOrigin: "bottom center",
                    maskImage: FLOOR_MASK,
                    WebkitMaskImage: FLOOR_MASK,
                    backgroundImage: STRIPES_MOBILE,
                }}
            >
                <svg
                    aria-hidden
                    viewBox="0 0 680 1050"
                    preserveAspectRatio="xMidYMax slice"
                    className="pointer-events-none absolute inset-0 h-full w-full text-slate-900/[0.10] dark:text-white/[0.11] [&_*]:[vector-effect:non-scaling-stroke]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <rect x="20" y="20" width="640" height="1010" />
                    <line x1="20" y1="525" x2="660" y2="525" />
                    <circle cx="340" cy="525" r="91.5" />
                    <circle cx="340" cy="525" r="4" fill="currentColor" stroke="none" />

                    {/* Far end (top) */}
                    <rect x="138.5" y="20" width="403" height="165" />
                    <rect x="248.5" y="20" width="183" height="55" />
                    <circle cx="340" cy="130" r="4" fill="currentColor" stroke="none" />
                    <path d="M266.9 185 A 91.5 91.5 0 0 0 413.1 185" />

                    {/* Near end (bottom) */}
                    <rect x="138.5" y="865" width="403" height="165" />
                    <rect x="248.5" y="975" width="183" height="55" />
                    <circle cx="340" cy="920" r="4" fill="currentColor" stroke="none" />
                    <path d="M266.9 865 A 91.5 91.5 0 0 1 413.1 865" />
                </svg>
            </div>
        </div>
    )
}
