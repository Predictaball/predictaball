import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ["flagcdn.com"]
    }
};

export default withSentryConfig(nextConfig, {
    // Source-map upload disabled until we set up SENTRY_AUTH_TOKEN. Without it
    // the build prints a warning but works; stack traces will be minified.
    silent: !process.env.CI,
    // Proxy Sentry requests through our own origin so ad-blockers don't drop
    // them. Adds a /monitoring route handled by the SDK.
    tunnelRoute: "/monitoring",
});
