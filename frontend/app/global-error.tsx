"use client"

// Catches root-layout errors and React render errors that escape route-level
// error.tsx boundaries. Without this, users see Next.js's generic error page
// and we get no telemetry. With it, every crash lands in Sentry.
import * as Sentry from "@sentry/nextjs"
import NextError from "next/error"
import { useEffect } from "react"

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    return (
        <html lang="en">
            <body>
                <NextError statusCode={0} />
            </body>
        </html>
    )
}
