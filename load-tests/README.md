# Load Tests

k6 load tests for the Predictaball API.

## Prerequisites

```bash
brew install k6
```

## Running

All tests are run from the repo root. Set `BASE_URL` to the target environment:

```bash
k6 run -e BASE_URL=http://<alb-url> load-tests/<test>.js
```

Add `--summary-trend-stats="avg,min,med,max,p(95),p(99)"` for detailed latency breakdown.

## Tests

### Smoke
Hit every endpoint once with a single user. Run this first to verify the API is working.
```bash
k6 run -e BASE_URL=http://<alb-url> load-tests/smoke.js
```

### Load
50 concurrent users for 3 minutes with realistic traffic: 60% browsing matches, 30% submitting predictions, 10% checking leaderboards.
```bash
k6 run -e BASE_URL=http://<alb-url> load-tests/load.js
```

### Spike
200 users hit the API simultaneously, simulating everyone refreshing when a match kicks off.
```bash
k6 run -e BASE_URL=http://<alb-url> load-tests/spike.js
```

### Live Match
200 users refreshing match list and leaderboard while an admin updates the score. Tests the write-heavy path (points recalculation, leaderboard rebuild, S3 write) under concurrent read load.

Requires existing test users from a previous spike test run, and an admin user in Cognito.
```bash
k6 run -e BASE_URL=http://<alb-url> -e ADMIN_EMAIL=<admin-email> load-tests/live-match.js
```

## Notes

- Tests create their own users via the signup endpoint (emails like `load-{timestamp}-{n}@test.com`)
- No cleanup needed, test users are harmless
- Run against your personal stack, not prod
- The setup phase for load/spike tests is slow (~0.15s per user) to stay under Cognito's signup rate limit
- Pass `-e TEST_PASSWORD=YourPassword` to override the default test password (`Test1234`)
- The live-match test reuses users from a previous spike test run rather than creating new ones
