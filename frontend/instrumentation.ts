// Next.js loads this once at server start. Routes to the right Sentry config
// based on which runtime is booting.
import * as Sentry from "@sentry/nextjs"

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("./sentry.server.config")
    }
    if (process.env.NEXT_RUNTIME === "edge") {
        await import("./sentry.edge.config")
    }
}

// Captures unhandled errors thrown from server route handlers, server actions,
// and server components. Requires @sentry/nextjs >= 8.28.0.
export const onRequestError = Sentry.captureRequestError
