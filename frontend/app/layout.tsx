import type {Metadata} from "next";
import {Barlow_Condensed, Montserrat} from "next/font/google";
import "./globals.css";
import {Providers} from "@/app/providers";
import LegalFooter from "@/app/components/legal-footer";
import React from "react";

const montserrat = Montserrat({subsets: ["latin"], variable: "--font-montserrat"});
// Display face: a condensed grotesque with kit-number/scoreboard character —
// deliberately a sports voice, not a tech one.
const barlowCondensed = Barlow_Condensed({
    subsets: ["latin"],
    weight: ["500", "600", "700", "800", "900"],
    variable: "--font-display",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://www.predictaball.live"),
    title: "Predictaball — World Cup 2026 score predictor",
    description: "Predict every match. Climb the table. Prove your ball knowledge.",
    openGraph: {
        title: "Predictaball — World Cup 2026 score predictor",
        description: "Predict every match. Climb the table. Prove your ball knowledge.",
        type: "website",
    },
};

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${montserrat.variable} ${barlowCondensed.variable} ${montserrat.className} bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white`}>
            <Providers>
                <div className="min-h-screen">{children}</div>
                <LegalFooter/>
            </Providers>
            </body>
        </html>
    );
}
