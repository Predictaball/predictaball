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
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            animation: {
                wiggle: 'wiggle 1s ease-in-out infinite',
                slide: 'slide 10s linear infinite',
                slideslow: 'slide 20s linear infinite',
                fastpulse: 'pulsing 1s linear infinite'
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': {transform: 'rotate(-3deg)'},
                    '50%': {transform: 'rotate(3deg)'},
                },
                slide: {
                    '0%': {
                        visibility: "visible",
                        transform: 'translateX(calc(100vw))'
                    },
                    '100%': {transform: 'translateX(calc(-100vw))'},
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
