import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Self-contained build output for running in a container: copies only the
    // production dependencies the app actually uses into .next/standalone, so
    // the runtime image doesn't need the full node_modules tree.
    output: "standalone",
    images: {
        domains: ["flagcdn.com"]
    },
    experimental: {
        // Rewrite barrel imports from @nextui-org/react into direct submodule
        // imports so only the components we use get bundled, not the whole lib.
        optimizePackageImports: ["@nextui-org/react"]
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
