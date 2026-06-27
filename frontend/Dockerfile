# syntax=docker/dockerfile:1.7

# Build context is the repo root so the OpenAPI contract one level up is
# reachable. Build with: docker build -f frontend/Dockerfile .

# --- deps -------------------------------------------------------------------
# Install Node deps once; reused by the builder stage.
FROM node:20-alpine AS deps
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# --- builder ----------------------------------------------------------------
# Generate the OpenAPI client (needs Java) then run `next build`.
FROM node:20-alpine AS builder
RUN apk add --no-cache openjdk17-jre
WORKDIR /build

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they MUST be passed as build args. Server-only secrets are NOT baked in —
# those come from the runtime environment.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV

COPY --from=deps /build/node_modules ./node_modules
COPY frontend/ ./
COPY contract/ ../contract/

RUN npm run build

# --- runner -----------------------------------------------------------------
# Minimal image: just the standalone output, static assets, and public/.
FROM node:20-alpine AS runner
WORKDIR /build

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /build/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /build/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
