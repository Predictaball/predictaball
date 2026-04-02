import type {Metadata} from "next";
import {Montserrat} from "next/font/google";
import "./globals.css";
import {Providers} from "@/app/providers";
import React from "react";

const montserrat = Montserrat({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Predictaball.live",
    description: "A score predictor for Euro 2024",
    openGraph: {
        title: "Predictaball.live",
        description: "A score predictor for Euro 2024",
        images: {
            url: "https://predictaball-teamflagsbucketb6ca46de-2uk8faboxd6r.s3.eu-west-2.amazonaws.com/hidden-image.png"
        }
    }
};

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={montserrat.className}>
            <Providers>
                {children}
            </Providers>
            </body>
        </html>
    );
}
