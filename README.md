# Predictaball

Score prediction webapp for the FIFA World Cup 2026.

## Structure

```
lambdas/    # Kotlin/http4k backend API
frontend/   # Next.js frontend
cdk/        # AWS CDK infrastructure
```

## Local Development

### Prerequisites

- Java 21
- Node.js 20+
- Docker (or [Finch](https://github.com/runfinch/finch)) for running Postgres locally

### Start Postgres

```bash
docker compose up -d
```

### Run the backend

```bash
cd lambdas
./gradlew runLocal
```

The server starts on `http://localhost:8080` with auth disabled.

### Run the frontend

```bash
cd frontend
npm install
npm run build-client
npm run dev
```

The frontend starts on `http://localhost:3000`, pointing at the local backend by default.

To point at the deployed backend instead:

```bash
NEXT_PUBLIC_API_URL=http://<alb-url> COGNITO_CLIENT_ID=<id> COGNITO_USER_POOL_ID=<pool-id> npm run dev
```

### Run tests

```bash
cd lambdas
./gradlew test              # unit tests
./gradlew integrationTest   # integration tests (requires Postgres)
```

## Deploy

```bash
cd lambdas && ./gradlew shadowJar
cd ../cdk && npm install && CDK_ACCOUNT_ID=<account-id> CDK_DB_PASSWORD=<password> npx cdk deploy --profile predictaball
```

<details>
<summary>Using Finch instead of Docker?</summary>

```bash
CDK_DOCKER=finch CDK_ACCOUNT_ID=<account-id> CDK_DB_PASSWORD=<password> npx cdk deploy --profile predictaball
```
</details>
