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
The server starts on `http://localhost:8080`.

3. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:3000`, pointing at the local backend.

4. Open `http://localhost:3000`, sign up with any email/password, and start using the app.

### Auth

Authentication uses [NextAuth.js v5](https://authjs.dev/) on the frontend with Google OAuth and email/password credentials. The backend issues HMAC JWTs for API authentication, verified using a shared `NEXTAUTH_SECRET`.

To test as an admin locally, sign up with `admin@test.com` (configurable via `LOCAL_ADMIN_EMAILS` env var in `build.gradle.kts`).

To test Google OAuth locally, add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` to `frontend/.env.local`.

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
cd ../cdk && npm install && CDK_ACCOUNT_ID=<account-id> CDK_DB_PASSWORD=<password> CDK_NEXTAUTH_SECRET=<secret> CDK_RESEND_API_KEY=<key> CDK_API_DOMAIN=<domain> npx cdk deploy --profile <profile>
```

<details>
<summary>Using Finch instead of Docker?</summary>

```bash
CDK_DOCKER=finch CDK_ACCOUNT_ID=<account-id> CDK_DB_PASSWORD=<password> CDK_NEXTAUTH_SECRET=<secret> CDK_RESEND_API_KEY=<key> npx cdk deploy --profile <profile>
```
</details>
