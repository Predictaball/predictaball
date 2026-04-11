import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const PASSWORD = __ENV.TEST_PASSWORD || "Test1234";

export function signup(email, firstName, familyName) {
  const res = http.post(
    `${BASE_URL}/user`,
    JSON.stringify({ email, password: PASSWORD, firstName, familyName }),
    { headers: { "Content-Type": "application/json" }, tags: { endpoint: "signup" } }
  );
  if (res.status !== 200) {
    console.error(`signup failed: ${res.status} ${res.body}`);
  }
  check(res, { "signup 200": (r) => r.status === 200 });
  return res;
}

export function login(email) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" }, tags: { endpoint: "login" } }
  );
  if (res.status !== 200) {
    console.error(`login failed: ${res.status} ${res.body}`);
  }
  if (res.status === 200) {
    return JSON.parse(res.body).idToken;
  }
  return null;
}

export function authHeaders(token) {
  return {
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  };
}

export { BASE_URL };
