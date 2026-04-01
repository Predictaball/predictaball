# Predictaball Roadmap

## Current State

The API is deployed on AWS ECS (Fargate) with an ALB, RDS Postgres, and Cognito auth. The frontend is a Next.js app on Vercel in a separate repo (`alicolver/score`).

Scheduled tasks (MatchStarter, ScoreUpdater) run in-process when `SCHEDULER_ENABLED=true`. Admin endpoints (`/admin/start-matches`, `/admin/update-scores`) are available for manual triggers. Leaderboard reads are served from an in-memory cache (infinite TTL with single instance, configurable via `CACHE_TTL_SECONDS`).

## Before the World Cup (June 2026)

### Monorepo
- Merge the frontend repo (`alicolver/score`) into this repo
- Structure: `backend/`, `frontend/`, `contract/`, `infra/`
- Frontend generates its TypeScript client from `contract/api-contract.yaml` at build time
- Update Vercel to point at the monorepo with root directory `frontend/` and ignored build step for backend-only changes

### Domain + HTTPS
- Point the existing domain at the ALB via Route 53
- Add an ACM certificate for TLS termination on the ALB
- Unlocks EventBridge API Destinations for scheduled tasks (replacing in-process schedulers)

### CI/CD
- Set up GitHub secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CDK_ACCOUNT_ID`, `CDK_DB_PASSWORD`)
- Workflow already written: build+test on all branches, deploy only on main

### Data
- Seed World Cup 2026 teams and match schedule
- Verify fotmob match IDs for score tracking
- Check if all matches kick off on the hour (if not, increase MatchStarter frequency)

## Done

- ~~Leaderboard redesign~~: batched prediction/fixedPoints updates, removed `recalculateLivePoints` and `livePoints` column, live points computed from predictions at query time
- ~~Leaderboard caching~~: in-memory cache in `LeaderboardS3Service`, populated on write, configurable TTL
- ~~Scheduled tasks~~: admin endpoints added, in-process schedulers gated by `SCHEDULER_ENABLED` env var
- Flyway DB migrations (migrations in `src/main/resources/db/migration/`)
- ~~S3 legacy cleanup~~: removed S3 live matches communication, ScoreUpdater queries DB directly

## Future Considerations

- EventBridge scheduled tasks (when HTTPS is set up, replace in-process schedulers)
- Integration tests against real Postgres using Testcontainers (current tests use H2 which has subtle SQL differences)
- S3 event notifications to invalidate leaderboard cache across multiple instances
- Auth: evaluate replacing Cognito post-tournament
- Server-Sent Events for live score push (replace frontend polling)
- http4k contract module for compile-time route safety
