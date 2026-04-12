# Predictaball

Score prediction webapp for the FIFA World Cup 2026.

## Structure

```
contract/   # OpenAPI spec (shared between backend and frontend)
lambdas/    # Kotlin/http4k backend API
frontend/   # Next.js frontend
cdk/        # AWS CDK infrastructure
load-tests/ # k6 load tests
```

## Local Development

### Prerequisites

- Java 21
- Node.js 20+
- Docker (or [Finch](https://github.com/runfinch/finch)) for running Postgres locally

### Quick Start

1. Start Postgres:
```bash
docker compose up -d
```

2. Start the backend:
```bash
cd lambdas
./gradlew runLocal
```
The server starts on `http://localhost:8080` with local auth (no Cognito needed).

3. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:3000`, pointing at the local backend.

4. Open `http://localhost:3000`, sign up with any email/password, and start using the app.

### Local Auth

The backend uses `AUTH_MODE=local` when running locally. This provides a full auth flow (signup, login, JWT tokens) without Cognito. Users are stored in memory and reset when the server restarts.

To test as an admin, sign up with `admin@test.com` (configurable via `LOCAL_ADMIN_EMAILS` env var in `build.gradle.kts`).

### Run Tests

```bash
cd lambdas
./gradlew test              # unit tests
./gradlew integrationTest   # integration tests (requires Postgres)
```

### Stop Postgres

```bash
docker compose down
```

## Deploy

Deployments to the dev account happen automatically via GitHub Actions on push to main.

To deploy manually:

```bash
cd lambdas && ./gradlew shadowJar
cd ../cdk && npm install && CDK_ACCOUNT_ID=<account-id> CDK_DB_PASSWORD=<password> CDK_API_DOMAIN=<domain> npx cdk deploy --profile <profile>
```

<details>
<summary>Using Finch instead of Docker?</summary>

```bash
CDK_DOCKER=finch CDK_ACCOUNT_ID=<account-id> CDK_DB_PASSWORD=<password> npx cdk deploy --profile <profile>
```
</details>
