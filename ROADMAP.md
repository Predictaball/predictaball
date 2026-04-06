# Predictaball Roadmap

## Current State

Monorepo with Kotlin/http4k backend and Next.js 15 frontend. Backend deployed on AWS ECS (Fargate) with ALB, RDS Postgres, Cognito auth with JWT verification, and S3 for leaderboard data. Frontend hosted on Vercel. WC2026 data seeded (48 teams, 72 group stage matches) via Flyway.

CI runs build, unit tests, integration tests, and frontend lint on all branches. Deploy is disabled until the shared dev account is set up.

## Before the World Cup (June 2026)

### Live Score Data Source
- Fotmob API blocked by Cloudflare, need an alternative
- Evaluate: API-Football (100 req/day free), Football-Data.org, OpenLigaDB, ESPN hidden API
- Update `ScoreUpdater.kt` and populate `external_match_id` column

### Admin API Key
- Add `X-Api-Key` header validation to `/admin/*` endpoints
- Shared secret via environment variable

### Domain + HTTPS
- `predictaball.live` domain purchased (registered outside AWS)
- Create Route 53 hosted zone, point nameservers from registrar
- ACM certificate for TLS termination on ALB
- `api.predictaball.live` for prod, `dev.api.predictaball.live` for dev
- Unlocks EventBridge API Destinations for scheduled tasks

### Shared Dev Account + CI Deploy
- Create new AWS account with fresh credits
- Set up GitHub secrets
- Re-enable deploy job in CI workflow

### Prod Account
- Create in May with fresh $200 credits

### Pre-Tournament Checks
- Verify kick-off times against FIFA's final schedule (late May)
- Test end-to-end flow: signup, predict, live scoring, leaderboard

## Future Considerations

- WAF on prod ALB
- EventBridge scheduled tasks (replace in-process schedulers, needs HTTPS)
- S3 event notifications to invalidate leaderboard cache across multiple instances
- Server-Sent Events for live score push (replace frontend polling)
- Evaluate replacing Cognito post-tournament
- shadcn/ui migration (replace NextUI)
- Tailwind 4 upgrade
