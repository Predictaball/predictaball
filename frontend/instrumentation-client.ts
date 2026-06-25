// Sentry client (browser) init. Loaded automatically by Next.js for the
// browser bundle. See https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs"

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    // Performance tracing — sample lightly to stay within free-tier budget;
    // we mainly want this for error crumbs, not as a performance product.
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    // Session Replay: 0% of normal sessions, but 100% of sessions that error.
    // The mobile-can't-open-devtools crash is exactly what this is for —
    // it captures DOM/event recording around the crash automatically.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
    environment: process.env.NEXT_PUBLIC_ENV || "development",
})

// App Router navigation tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
