import http from "k6/http";
import { check, sleep } from "k6";
import { signup, login, authHeaders, BASE_URL } from "./helpers.js";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate==1"],
    "http_req_duration{endpoint:ping}": ["max>=0"],
    "http_req_duration{endpoint:signup}": ["max>=0"],
    "http_req_duration{endpoint:login}": ["max>=0"],
    "http_req_duration{endpoint:match_list}": ["max>=0"],
    "http_req_duration{endpoint:match_upcoming}": ["max>=0"],
    "http_req_duration{endpoint:user_leagues}": ["max>=0"],
    "http_req_duration{endpoint:leaderboard}": ["max>=0"],
    "http_req_duration{endpoint:prediction_create}": ["max>=0"],
    "http_req_duration{endpoint:prediction_get}": ["max>=0"],
  },
};

export default function () {
  const ts = Date.now();
  const email = `smoke-${ts}@test.com`;

  check(http.get(`${BASE_URL}/ping`, { tags: { endpoint: "ping" } }), {
    "ping 200": (r) => r.status === 200,
  });

  signup(email, "Smoke", "Test");
  sleep(1);
  const token = login(email);
  if (!token) return;
  const auth = authHeaders(token);

  check(http.get(`${BASE_URL}/match/list`, { ...auth, tags: { endpoint: "match_list" } }), {
    "match list 200": (r) => r.status === 200,
    "has matches": (r) => JSON.parse(r.body).length > 0,
  });

  check(http.get(`${BASE_URL}/match/list?filterType=upcoming`, { ...auth, tags: { endpoint: "match_upcoming" } }), {
    "upcoming 200": (r) => r.status === 200,
  });

  check(http.get(`${BASE_URL}/user/leagues`, { ...auth, tags: { endpoint: "user_leagues" } }), {
    "leagues 200": (r) => r.status === 200,
  });

  check(http.get(`${BASE_URL}/league/global/leaderboard?pageSize=200`, { ...auth, tags: { endpoint: "leaderboard" } }), {
    "leaderboard 200": (r) => r.status === 200,
  });

  const predRes = http.post(
    `${BASE_URL}/prediction`,
    JSON.stringify({ matchId: "1", homeScore: 2, awayScore: 1 }),
    { ...auth, tags: { endpoint: "prediction_create" } }
  );
  check(predRes, { "prediction 200": (r) => r.status === 200 });

  check(http.get(`${BASE_URL}/prediction/1`, { ...auth, tags: { endpoint: "prediction_get" } }), {
    "get prediction 200": (r) => r.status === 200,
  });
}
