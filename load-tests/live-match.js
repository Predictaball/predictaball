import http from "k6/http";
import { check, sleep } from "k6";
import { login, authHeaders, BASE_URL } from "./helpers.js";
import exec from "k6/execution";

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "load-1775938731834-25@test.com";

export const options = {
  setupTimeout: "300s",
  scenarios: {
    live_match: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 50 },   // users arrive
        { duration: "2m", target: 200 },    // match is live, everyone refreshing
        { duration: "10s", target: 0 },     // match ends
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
    "http_req_duration{endpoint:set_score}": ["max>=0"],
    "http_req_duration{endpoint:match_live}": ["max>=0"],
    "http_req_duration{endpoint:leaderboard}": ["max>=0"],
  },
};

export function setup() {
  // Reuse existing test users from previous runs
  const users = [];
  const res = http.get(`${BASE_URL}/ping`);
  if (res.status !== 200) throw new Error("API not reachable");

  // Login admin
  const adminToken = login(ADMIN_EMAIL);
  if (!adminToken) throw new Error("Admin login failed");

  // Login a batch of existing test users
  // We'll try spike users from the previous run
  const ts = "1775939909678"; // from the spike test
  for (let i = 0; i < 200; i++) {
    const email = `spike-${ts}-${i}@test.com`;
    const token = login(email);
    if (token) {
      users.push({ email, token });
    }
  }

  if (users.length === 0) throw new Error("No test users found. Run spike.js first to create users.");

  return { users, adminToken };
}

export default function (data) {
  const user = data.users[exec.vu.idInTest % data.users.length];
  if (!user) return;
  const auth = authHeaders(user.token);

  // First VU periodically updates the score (simulates live score feed)
  if (exec.vu.idInInstance === 1 && exec.scenario.iterationInInstance % 5 === 0) {
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 4);
    const adminAuth = authHeaders(data.adminToken);
    check(
      http.post(
        `${BASE_URL}/match/1/score`,
        JSON.stringify({ homeScore, awayScore }),
        { ...adminAuth, tags: { endpoint: "set_score" } }
      ),
      { "set score 200": (r) => r.status === 200 }
    );
  }

  // All users refresh live matches + leaderboard
  check(
    http.get(`${BASE_URL}/match/list?filterType=live`, { ...auth, tags: { endpoint: "match_live" } }),
    { "live 200": (r) => r.status === 200 }
  );

  check(
    http.get(`${BASE_URL}/league/global/leaderboard?pageSize=200`, { ...auth, tags: { endpoint: "leaderboard" } }),
    { "leaderboard 200": (r) => r.status === 200 }
  );

  sleep(Math.random() * 2 + 1); // 1-3 seconds between refreshes
}
