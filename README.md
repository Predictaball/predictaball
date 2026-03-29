# Scorcerer

Score prediction backend API for the Predictaball webapp.

## Local Development

### Prerequisites

- Java 21
- Docker (or [Finch](https://github.com/runfinch/finch)) for running Postgres locally

### Start Postgres

```bash
docker compose up -d
```

This starts a Postgres 16 instance on `localhost:5432` with user/password `postgres`.

### Run the server

```bash
cd lambdas
./gradlew runLocal
```

The server starts on `http://localhost:8080` with auth disabled. All authenticated endpoints use a test user (`test-user-123`). Tables are created automatically on startup.

### Test it

```bash
curl http://localhost:8080/ping        # health check
curl http://localhost:8080/match/list  # returns [] when DB is empty
```

### Stop Postgres

```bash
docker compose down
```

## Build

```bash
cd lambdas
./gradlew shadowJar    # builds fat jar at build/libs/scorcerer.jar
./gradlew test         # run tests
```

## Deploy

```bash
cd cdk
CDK_ACCOUNT_ID=<your-account-id> CDK_DB_PASSWORD=<password> npm run cdk -- deploy
```
