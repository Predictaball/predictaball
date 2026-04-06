# Predictaball CDK

Infrastructure as code for the Predictaball webapp, deployed to AWS using CDK (TypeScript).

## Architecture

- ECS Fargate service behind an Application Load Balancer
- RDS Postgres (t3.micro)
- Cognito user pool for authentication
- S3 bucket for leaderboard data

## Prerequisites

- Node.js
- AWS CLI configured with a profile (e.g. `predictaball`)
- [Finch](https://github.com/runfinch/finch) or Docker for building container images
- The backend jar must be built first: `cd ../lambdas && ./gradlew shadowJar`

## Environment Variables

| Variable | Description |
|---|---|
| `CDK_ACCOUNT_ID` | AWS account ID to deploy to |
| `CDK_REGION` | AWS region (defaults to `eu-west-2`) |
| `CDK_DB_PASSWORD` | Password for the RDS database |
| `CDK_DOCKER` | Set to `finch` if using Finch instead of Docker |

## Deploy

```bash
npm install
CDK_DOCKER=finch CDK_ACCOUNT_ID=<account-id> CDK_DB_PASSWORD=<password> npx cdk deploy --profile predictaball
```

## Useful Commands

- `npx cdk synth` - Synthesize the CloudFormation template
- `npx cdk diff` - Preview changes before deploying
- `npx cdk deploy --profile <profile>` - Deploy the stack
