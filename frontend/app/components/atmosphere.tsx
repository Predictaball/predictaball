import React from "react"

/**
 * Football-pitch background motif. PitchLines draws the markings top-down;
 * PitchPerspective tilts them into a receding stadium floor behind hero content.
 */

/**
 * The pitch, laid flat in 3D so it recedes to a horizon like a real stadium
 * floor, then faded out with a mask so it dissolves into the page instead of
 * ending on a hard edge. Drop it inside any `relative` surface (it fills its
 * positioned parent); content rendered above it appears to stand on the pitch.
 */
export function PitchPerspective({className = ""}: {className?: string}): React.JSX.Element {
    return (
        <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
            style={{perspective: "1000px"}}
        >
            <div
                className="absolute bottom-0 left-1/2 h-[85%] w-[150%]"
                style={{
                    transform: "translateX(-50%) rotateX(64deg)",
                    transformOrigin: "bottom center",
                    maskImage: "linear-gradient(to top, rgba(0,0,0,0.95), transparent 72%)",
                    WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.95), transparent 72%)",
                }}
            >
                <PitchLines/>
            </div>
        </div>
    )
}

export function PitchLines({className = ""}: {className?: string}): React.JSX.Element {
    // A real pitch, drawn to roughly regulation proportions (105 × 68) in a
    // landscape viewBox with the goals at left and right. preserveAspectRatio
    // "slice" lets it fill and crop behind content rather than letterbox.
    return (
        <svg
            aria-hidden
            viewBox="0 0 1050 680"
            preserveAspectRatio="xMidYMid slice"
            className={`pointer-events-none absolute inset-0 h-full w-full text-slate-900/[0.04] dark:text-white/[0.05] ${className}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
        >
            {/* Touchlines / goal lines */}
            <rect x="20" y="20" width="1010" height="640" />
            {/* Halfway line */}
            <line x1="525" y1="20" x2="525" y2="660" />
            {/* Centre circle + spot */}
            <circle cx="525" cy="340" r="91.5" />
            <circle cx="525" cy="340" r="4" fill="currentColor" stroke="none" />

            {/* Left end: penalty box, six-yard box, penalty spot, and the D */}
            <rect x="20" y="138.5" width="165" height="403" />
            <rect x="20" y="248.5" width="55" height="183" />
            <circle cx="130" cy="340" r="4" fill="currentColor" stroke="none" />
            <path d="M185 266.9 A 91.5 91.5 0 0 1 185 413.1" />

            {/* Right end: mirror of the left */}
            <rect x="865" y="138.5" width="165" height="403" />
            <rect x="975" y="248.5" width="55" height="183" />
            <circle cx="920" cy="340" r="4" fill="currentColor" stroke="none" />
            <path d="M865 266.9 A 91.5 91.5 0 0 0 865 413.1" />
        </svg>
    )
}
