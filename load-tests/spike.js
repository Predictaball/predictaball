import http from "k6/http";
import { check, sleep } from "k6";
import { signup, login, authHeaders, BASE_URL } from "./helpers.js";
import exec from "k6/execution";

export const options = {
  setupTimeout: "300s",
  scenarios: {
    kickoff_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },   // warm up
        { duration: "10s", target: 200 },   // spike: match kicks off
        { duration: "2m", target: 200 },    // sustained
        { duration: "10s", target: 10 },    // drop off
        { duration: "30s", target: 0 },     // cool down
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};

export function setup() {
  const users = [];
  const ts = Date.now();
  const count = 200;

  for (let i = 0; i < count; i++) {
    const email = `spike-${ts}-${i}@test.com`;
    signup(email, `Spike${i}`, "Test");
    sleep(0.15);
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

  // Everyone refreshes at once: match list + leaderboard
  check(http.get(`${BASE_URL}/match/list?filterType=live`, auth), {
    "live 200": (r) => r.status === 200,
  });

  check(http.get(`${BASE_URL}/league/global/leaderboard?pageSize=200`, auth), {
    "leaderboard 200": (r) => r.status === 200,
  });

  sleep(Math.random() * 3 + 1); // 1-4 seconds between refreshes
}
