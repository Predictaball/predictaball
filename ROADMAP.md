# Predictaball Roadmap

## Current State

The API is deployed on AWS ECS (Fargate) with an ALB, RDS Postgres, and Cognito auth. The frontend is a Next.js app on Vercel. Both repos are currently separate.

## Before the World Cup (June 2026)

### Monorepo
- Merge the frontend repo (`alicolver/score`) into this repo
- Structure: `backend/`, `frontend/`, `contract/`, `infra/`
- Frontend generates its TypeScript client from `contract/api-contract.yaml` at build time
- Update Vercel to point at the monorepo with root directory `frontend/` and ignored build step for backend-only changes

### Domain + HTTPS
- Point the existing domain at the ALB via Route 53
- Add an ACM certificate for TLS termination on the ALB

### CI/CD
- Rewrite GitHub Actions workflow for the monorepo
- Build jar, build Docker image, `cdk deploy` on push to main
- Health check after deploy

### Data
- Seed World Cup 2026 teams and match schedule
- Verify fotmob match IDs for score tracking
- Check if all matches kick off on the hour (if not, increase MatchStarter frequency)

## Post-Deploy Improvements

### Leaderboard Redesign
- Remove `recalculateLivePoints()`, derive live points from predictions at query time
- Remove `livePoints` column from MemberTable (or keep as convenience, updated only on match completion)
- Batch DB operations: single UPDATE with CASE expression for prediction points, single UPDATE with subquery for member fixedPoints

### Leaderboard Caching
- In-memory cache with 2-3 minute TTL for leaderboard reads
- Invalidate on score changes

### Auth
- Evaluate replacing Cognito with Auth0 or rolling own auth if pain points persist
- Simplify password reset email flow

## Future Considerations

- Server-Sent Events for live score push (replace frontend polling)
- http4k contract module for compile-time route safety
- Flyway for database migrations if schema changes become frequent
