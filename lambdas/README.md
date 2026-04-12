# Predictaball API

Kotlin/http4k backend for the Predictaball score prediction webapp.

## Tech Stack

- Kotlin 2.3 / JVM 21
- http4k v6 (Netty server)
- Exposed ORM with Postgres
- HikariCP connection pooling
- Jackson for JSON serialization
- OpenAPI Generator for model classes (generated from `../contract/api-contract.yaml`)

## Project Structure

```
src/main/kotlin/scorcerer/
  server/
    resources/     # HTTP route handlers
    services/      # Business logic (match scoring)
    db/tables/     # Exposed table definitions
    schedule/      # MatchStarter and ScoreUpdater scheduled tasks
    Server.kt      # Entry point, route wiring, filters
    Filters.kt     # Logging, error handling, auth filters
    Auth.kt        # Auth extraction utilities
    Json.kt        # Jackson toJson/fromJson helpers
    Environment.kt # Environment variable config
  utils/           # Leaderboard, points calculation
../contract/
  api-contract.yaml  # OpenAPI spec (source of truth for frontend client generation)
src/main/resources/
  db/migration/    # Flyway SQL migrations
```

## Build

```bash
./gradlew shadowJar    # fat jar at build/libs/scorcerer.jar
./gradlew test         # run tests
```

## Run Locally

See the root [README](../README.md) for local development setup.

## API Endpoints

All endpoints except auth require a valid Cognito JWT. Locally, auth is disabled and all requests use a test user.

### Auth
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh an expired ID token
- `POST /auth/reset` - Request password reset
- `POST /auth/reset-confirm` - Confirm password reset with OTP
- `POST /user` - Sign up

### Matches
- `GET /match/list` - List matches (filterable by state, includes user's predictions)
- `GET /match/data/{matchId}` - Get a single match
- `POST /match` - Create a match (admin)
- `POST /match/{matchId}/score` - Update live score (admin)
- `POST /match/{matchId}/complete` - Mark match as completed (admin)
- `GET /match/{matchId}/predictions` - Get predictions for a match

### Predictions
- `POST /prediction` - Create or update a prediction
- `GET /prediction/{matchId}` - Get your prediction for a match

### Leagues
- `POST /league` - Create a league
- `GET /league/{leagueId}` - Get league details
- `GET /league/{leagueId}/leaderboard` - Get league leaderboard
- `POST /league/{leagueId}/join` - Join a league
- `POST /league/{leagueId}/leave` - Leave a league

### Teams
- `POST /team` - Create a team (admin)
- `GET /team/{teamId}` - Get a team
- `GET /team/name/{teamName}` - Get a team by name

### User
- `GET /user/leagues` - Get your leagues
- `GET /user/{userId}/points` - Get user points
- `GET /user/{userId}/predictions` - Get user predictions

### Health
- `GET /ping` - Health check

### Admin (internal, not in contract)
- `POST /admin/start-matches` - Trigger match starter
- `POST /admin/update-scores` - Trigger score updater
- `POST /admin/recalculate-points` - Recalculate all member fixed points
