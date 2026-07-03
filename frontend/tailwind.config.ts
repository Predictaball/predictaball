import type {Config} from "tailwindcss";
import {nextui} from "@nextui-org/react";
import plugin from "tailwindcss/plugin";
import {nesting} from "postcss-selector-parser";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // ── Brand re-skin ────────────────────────────────────────────────
            // `cyan` and `teal` are used *exclusively* as the brand accent /
            // gradient across the app (see util/css-classes.ts). The default
            // pastel cyan→mint reads as a generic "AI template". We retire it by
            // repointing those two scales at a deeper, more deliberate
            // indigo → violet band — so every existing `cyan-*` / `teal-*`
            // utility re-themes at once without touching call sites. `blue`
            // stays real blue so the gradient reads blue → indigo → violet.
            colors: {
                cyan: {
                    50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc",
                    400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca",
                    800: "#3730a3", 900: "#312e81", 950: "#1e1b4b",
                },
                teal: {
                    50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
                    400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9",
                    800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065",
                },
            },
            fontFamily: {
                sans: ["var(--font-montserrat)", "ui-sans-serif", "system-ui", "sans-serif"],
                display: ["var(--font-display)", "var(--font-montserrat)", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            animation: {
                wiggle: 'wiggle 1s ease-in-out infinite',
                slide: 'slide 10s linear infinite',
                slideslow: 'slide 20s linear infinite',
                fastpulse: 'pulsing 1s linear infinite',
                scroll: 'scroll 55s linear infinite',
                scrollReverse: 'scrollReverse 45s linear infinite',
                gradient: 'gradient 6s ease infinite',
                // Section entrance: fade up into place. `both` fill keeps the
                // element hidden through any animation-delay (no flash) and
                // pinned in place once it lands.
                'fade-rise': 'fade-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': {transform: 'rotate(-3deg)'},
                    '50%': {transform: 'rotate(3deg)'},
                },
                'fade-rise': {
                    '0%': {opacity: '0', transform: 'translateY(14px)'},
                    '100%': {opacity: '1', transform: 'translateY(0)'},
                },
                slide: {
                    '0%': {
                        visibility: "visible",
                        transform: 'translateX(calc(100vw))'
                    },
                    '100%': {transform: 'translateX(calc(-100vw))'},
                },
                scroll: {
                    '0%': {transform: 'translateX(0)'},
                    '100%': {transform: 'translateX(-50%)'},
                },
                scrollReverse: {
                    '0%': {transform: 'translateX(-50%)'},
                    '100%': {transform: 'translateX(0)'},
                },
                gradient: {
                    '0%, 100%': {'background-position': '0% 50%'},
                    '50%': {'background-position': '100% 50%'},
                },
                pulsing: {
                    '0%,100%': {
                        opacity: '1'
                    },
                    '50%': {
                        opacity: '.5'
                    }
                }
            }
        },
    },
    darkMode: "class",
    plugins: [
        nesting,
        nextui({
            layout: {
                disabledOpacity: "0.3",
                radius: {
                    small: "3px",
                    medium: "5px",
                    large: "7px",
                },
                borderWidth: {
                    small: "1px",
                    medium: "1px",
                    large: "2px",
                },
            },
            themes: {
                light: {},
                dark: {}
            }
        }),
        plugin(({matchUtilities, theme}) => {
            matchUtilities(
                {
                    "animation-delay": (value) => {
                        return {
                            "animation-delay": value,
                        };
                    },
                },
                {
                    values: theme("transitionDelay"),
                }
            );
        }),
    ]
};
export default config;
