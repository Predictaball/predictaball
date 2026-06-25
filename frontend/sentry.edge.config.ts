// Sentry edge runtime init. Loaded by instrumentation.ts when
// NEXT_RUNTIME === "edge". Used by middleware and edge route handlers.
import * as Sentry from "@sentry/nextjs"

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    environment: process.env.NEXT_PUBLIC_ENV || "development",
})
