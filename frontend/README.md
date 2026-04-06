# Predictaball Frontend

Next.js frontend for the Predictaball score prediction webapp.

## Tech Stack

- Next.js 15 / React 19
- NextUI component library
- Tailwind CSS
- TypeScript API client generated from the backend OpenAPI contract

## Setup

```bash
npm install
npm run build-client   # generates TypeScript client from ../lambdas/contract/api-contract.yaml
```

## Development

Run against the local backend (default):

```bash
npm run dev
```

Run against the deployed backend:

```bash
NEXT_PUBLIC_API_URL=http://<alb-url> COGNITO_CLIENT_ID=<id> COGNITO_USER_POOL_ID=<pool-id> npm run dev
```

## Build

```bash
COGNITO_CLIENT_ID=<id> COGNITO_USER_POOL_ID=<pool-id> npm run build
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (defaults to `http://localhost:8080`) |
| `COGNITO_CLIENT_ID` | Cognito user pool client ID |
| `COGNITO_USER_POOL_ID` | Cognito user pool ID |
