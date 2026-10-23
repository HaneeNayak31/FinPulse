import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, apiRequest } from "./testHelper";
import { resetRateLimits } from "../src/middleware/rateLimiter";

describe("Phase 6: CORS and Authentication Rate-Limiting Tests", () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  test("database readiness endpoint confirms PostgreSQL connectivity", async () => {
    const res = await apiRequest("/health/ready");

    assert.equal(res.status, 200);
    assert.equal(res.data.database, "connected");
  });

  test("CORS allows requests from configured origin (http://localhost:5173)", async () => {
    const res = await apiRequest("/assets", {
      headers: {
        Origin: "http://localhost:5173",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("access-control-allow-origin"),
      "http://localhost:5173",
    );
    assert.equal(
      res.headers.get("access-control-allow-credentials"),
      "true",
    );
  });

  test("CORS allows requests from configured alternate origin (http://127.0.0.1:5173)", async () => {
    const res = await apiRequest("/assets", {
      headers: {
        Origin: "http://127.0.0.1:5173",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("access-control-allow-origin"),
      "http://127.0.0.1:5173",
    );
  });

  test("CORS preflight OPTIONS request from allowed origin returns 204 No Content with allowed methods", async () => {
    const res = await apiRequest("/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
      },
    });

    assert.equal(res.status, 204);
    assert.equal(
      res.headers.get("access-control-allow-origin"),
      "http://localhost:5173",
    );
    assert.match(
      res.headers.get("access-control-allow-methods") || "",
      /POST/,
    );
  });

  test("CORS allows the deployed frontend and auth preflight headers", async () => {
    const res = await apiRequest("/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "https://fin-pulse-lime.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });

    assert.equal(res.status, 204);
    assert.equal(
      res.headers.get("access-control-allow-origin"),
      "https://fin-pulse-lime.vercel.app",
    );
    assert.match(res.headers.get("access-control-allow-methods") || "", /POST/);
    assert.match(res.headers.get("access-control-allow-headers") || "", /Authorization/i);
    assert.match(res.headers.get("access-control-allow-headers") || "", /Content-Type/i);
  });

  test("CORS preflight OPTIONS request from disallowed origin returns 403 Forbidden", async () => {
    const res = await apiRequest("/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://malicious-phishing-site.com",
      },
    });

    assert.equal(res.status, 403);
    assert.equal(res.data.error, "CORS_ORIGIN_DENIED");
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });

  test("CORS regular request from disallowed origin does NOT get access-control-allow-origin", async () => {
    const res = await apiRequest("/assets", {
      headers: {
        Origin: "http://unauthorized-domain.com",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("access-control-allow-origin"),
      null,
      "Browser must not receive Access-Control-Allow-Origin for unauthorized domain",
    );
  });

  test("Rate Limiter: Blocks excessive authentication requests with 429 and Retry-After header", async () => {
    resetRateLimits();
    const testIp = "203.0.113.42";

    // In test environment, threshold is set to 50 requests.
    // Send 50 valid/invalid requests from this IP
    for (let i = 0; i < 50; i++) {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        headers: { "X-Forwarded-For": testIp },
        body: { email: "fake@test.com", password: "wrong" },
      });
      // Should either be 400 or 401, but NOT 429 yet
      assert.ok(res.status !== 429, `Request ${i + 1} should not be rate-limited`);
    }

    // The 51st request MUST be rate limited
    const blockedRes = await apiRequest("/auth/login", {
      method: "POST",
      headers: { "X-Forwarded-For": testIp },
      body: { email: "fake@test.com", password: "wrong" },
    });

    assert.equal(blockedRes.status, 429);
    assert.equal(blockedRes.data.error, "RATE_LIMIT_EXCEEDED");
    assert.ok(blockedRes.headers.get("retry-after") !== null);

    // Another distinct IP address is NOT affected
    const differentIpRes = await apiRequest("/auth/login", {
      method: "POST",
      headers: { "X-Forwarded-For": "198.51.100.99" },
      body: { email: "fake@test.com", password: "wrong" },
    });
    assert.ok(differentIpRes.status !== 429, "Distinct IP must not be blocked by another IP's rate limit");
  });
});
