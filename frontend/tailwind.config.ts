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
            fontFamily: {
                sans: ["var(--font-montserrat)", "ui-sans-serif", "system-ui", "sans-serif"],
                display: ["var(--font-display)", "var(--font-montserrat)", "sans-serif"],
            },
            // Brand green — the pitch. A grass-green ramp used flat (no
            // gradients): 700 for text accents on light surfaces, 300/400 for
            // dark mode, 600 for solid fills like buttons and chyron tabs.
            colors: {
                pitch: {
                    50: "#f2faf4",
                    100: "#e0f5e6",
                    200: "#c2e9cf",
                    300: "#93d6ab",
                    400: "#5cbc80",
                    500: "#36a15f",
                    600: "#26824b",
                    700: "#20683e",
                    800: "#1d5334",
                    900: "#18452c",
                    950: "#0b2617",
                },
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
