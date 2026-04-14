'use client'

import React, {useEffect, useRef, useState} from "react"

export default function CustomCursor(): React.JSX.Element | null {
    const ballRef = useRef<HTMLDivElement>(null)
    const pos = useRef({x: -100, y: -100})
    const target = useRef({x: -100, y: -100})
    const rotation = useRef(0)
    const [enabled, setEnabled] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [hovering, setHovering] = useState(false)

    useEffect(() => {
        const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
        if (!hasFinePointer) return
        setEnabled(true)
        document.documentElement.classList.add('has-custom-cursor')

        const onMove = (e: MouseEvent) => {
            target.current.x = e.clientX
            target.current.y = e.clientY
            const el = e.target as HTMLElement | null
            setHovering(!!el?.closest('a, button, [role="button"]'))
        }
        const onDown = () => setPressed(true)
        const onUp = () => setPressed(false)
        const onLeave = () => {
            target.current.x = -100
            target.current.y = -100
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mousedown', onDown)
        window.addEventListener('mouseup', onUp)
        document.addEventListener('mouseleave', onLeave)

        let raf = 0
        const tick = () => {
            const dx = target.current.x - pos.current.x
            const dy = target.current.y - pos.current.y
            pos.current.x += dx * 0.22
            pos.current.y += dy * 0.22
            const dist = Math.hypot(dx, dy)
            rotation.current += dist * 2.2
            if (ballRef.current) {
                ballRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%) rotate(${rotation.current}deg)`
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mousedown', onDown)
            window.removeEventListener('mouseup', onUp)
            document.removeEventListener('mouseleave', onLeave)
            cancelAnimationFrame(raf)
            document.documentElement.classList.remove('has-custom-cursor')
        }
    }, [])

    if (!enabled) return null

    return (
        <div
            ref={ballRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
            style={{
                transition: 'width 180ms ease, height 180ms ease, opacity 180ms ease',
                width: hovering ? 36 : 24,
                height: hovering ? 36 : 24,
            }}
        >
            <div
                className="h-full w-full rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                style={{
                    transform: pressed ? 'scale(0.8, 1.1)' : 'scale(1)',
                    transition: 'transform 120ms cubic-bezier(.2,.9,.3,1.4)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                    <defs>
                        <radialGradient id="ballSphere" cx="35%" cy="30%" r="75%">
                            <stop offset="0%" stopColor="#ffffff"/>
                            <stop offset="60%" stopColor="#f3f4f6"/>
                            <stop offset="100%" stopColor="#9ca3af"/>
                        </radialGradient>
                        <clipPath id="ballClip">
                            <circle cx="50" cy="50" r="49"/>
                        </clipPath>
                    </defs>

                    <circle cx="50" cy="50" r="49" fill="url(#ballSphere)"/>

                    <g clipPath="url(#ballClip)" fill="#111827">
                        <polygon points="50,36 61.3,44.2 57,57.5 43,57.5 38.7,44.2"/>
                        <polygon points="50,8 58,14 58,22 50,26 42,22 42,14"/>
                        <polygon points="88,32 94,40 92,50 84,50 80,42 82,34"/>
                        <polygon points="12,32 20,34 22,42 18,50 10,50 8,40"/>
                        <polygon points="74,78 82,82 82,92 74,96 66,92 66,82"/>
                        <polygon points="34,78 42,82 42,92 34,96 26,92 26,82"/>
                    </g>

                    <g clipPath="url(#ballClip)" stroke="#111827" strokeWidth="1.4" strokeLinecap="round" fill="none">
                        <line x1="50" y1="36" x2="50" y2="26"/>
                        <line x1="61.3" y1="44.2" x2="80" y2="42"/>
                        <line x1="57" y1="57.5" x2="66" y2="82"/>
                        <line x1="43" y1="57.5" x2="34" y2="82"/>
                        <line x1="38.7" y1="44.2" x2="22" y2="42"/>
                    </g>

                    <circle cx="50" cy="50" r="49" fill="none" stroke="#111827" strokeWidth="1.2" opacity="0.25"/>
                </svg>
            </div>
        </div>
    )
}
