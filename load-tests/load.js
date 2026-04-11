import http from "k6/http";
import { check, sleep, group } from "k6";
import { signup, login, authHeaders, BASE_URL } from "./helpers.js";
import { SharedArray } from "k6/data";
import exec from "k6/execution";

export const options = {
  setupTimeout: "300s",
  scenarios: {
    tournament_evening: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },  // ramp up (signup phase)
        { duration: "3m", target: 50 },   // steady load
        { duration: "10s", target: 0 },   // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    "http_req_duration{group:::browse_matches}": ["p(95)<500"],
    "http_req_duration{group:::leaderboard}": ["p(95)<500"],
    "http_req_duration{group:::predict}": ["p(95)<1000"],
    checks: ["rate>0.95"],
  },
};

export function setup() {
  // Create test users sequentially to avoid Cognito rate limits
  const users = [];
  const ts = Date.now();
  const count = 50;

  for (let i = 0; i < count; i++) {
    const email = `load-${ts}-${i}@test.com`;
    signup(email, `Load${i}`, "Test");
    sleep(0.2); // stay under Cognito rate limit
    const token = login(email);
    if (token) {
      users.push({ email, token });
    }
  }
  return { users };
}

export default function (data) {
  const user = data.users[exec.vu.idInTest % data.users.length];
  if (!user) return;
  const auth = authHeaders(user.token);

  // Weighted random: 60% browse, 30% predict, 10% leagues
  const roll = Math.random();

  if (roll < 0.6) {
    group("browse_matches", () => {
      check(http.get(`${BASE_URL}/match/list?filterType=upcoming`, auth), {
        "upcoming 200": (r) => r.status === 200,
      });
      sleep(1);

      check(http.get(`${BASE_URL}/match/list?filterType=live`, auth), {
        "live 200": (r) => r.status === 200,
      });
      sleep(1);
    });
  } else if (roll < 0.9) {
    group("predict", () => {
      // Get upcoming matches then predict a random one
      const res = http.get(`${BASE_URL}/match/list?filterType=upcoming`, auth);
      if (res.status === 200) {
        const matches = JSON.parse(res.body);
        if (matches.length > 0) {
          const match = matches[Math.floor(Math.random() * matches.length)];
          const prediction = {
            matchId: match.matchId,
            homeScore: Math.floor(Math.random() * 4),
            awayScore: Math.floor(Math.random() * 4),
          };
          check(
            http.post(`${BASE_URL}/prediction`, JSON.stringify(prediction), auth),
            { "prediction 200": (r) => r.status === 200 }
          );
        }
      }
      sleep(2);
    });
  } else {
    group("leaderboard", () => {
      check(
        http.get(`${BASE_URL}/league/global/leaderboard?pageSize=200`, auth),
        { "leaderboard 200": (r) => r.status === 200 }
      );
      sleep(2);

      check(http.get(`${BASE_URL}/user/leagues`, auth), {
        "user leagues 200": (r) => r.status === 200,
      });
      sleep(1);
    });
  }
}
