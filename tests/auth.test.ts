import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, apiRequest } from "./testHelper";
import { cleanTestDb } from "./setupTestDb";

describe("Phase 3: Authentication & Authorization Tests", () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  test("Registration fails if fields are missing", async () => {
    const res = await apiRequest("/auth/register", {
      method: "POST",
      body: { username: "alice" },
    });
    assert.equal(res.status, 400);
  });

  test("Registration fails if password is less than 8 characters", async () => {
    const res = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        username: "alice",
        email: "alice@test.com",
        password: "short",
      },
    });
    assert.equal(res.status, 400);
  });

  test("Successful user registration creates user and returns 201", async () => {
    const res = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        username: "testuser1",
        email: "testuser1@example.com",
        password: "password123",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.user.email, "testuser1@example.com");
    assert.ok(res.data.user.id);
  });

  test("Registration fails with 409 Conflict if email already exists", async () => {
    const res = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        username: "testuser1_dup",
        email: "testuser1@example.com",
        password: "password123",
      },
    });
    assert.equal(res.status, 409);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /already exists/i);
  });

  test("Login fails with 400 if credentials are missing", async () => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "testuser1@example.com" },
    });
    assert.equal(res.status, 400);
  });

  test("Login fails with 401 if user does not exist", async () => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: "nonexistent@example.com",
        password: "password123",
      },
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.success, false);
  });

  test("Login fails with 401 if password is incorrect", async () => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: "testuser1@example.com",
        password: "wrongpassword123",
      },
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.success, false);
  });

  test("Login succeeds with 200 and returns valid JWT token", async () => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: "testuser1@example.com",
        password: "password123",
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(typeof res.data.token === "string" && res.data.token.length > 20);
  });

  test("Protected route (/auth/me) rejects requests without Authorization header with 401", async () => {
    const res = await apiRequest("/auth/me", {
      method: "GET",
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.message, "Missing or invalid token");
  });

  test("Protected route (/auth/me) rejects requests with malformed token with 401", async () => {
    const res = await apiRequest("/auth/me", {
      method: "GET",
      token: "malformed.jwt.token",
    });
    assert.equal(res.status, 401);
  });

  test("Protected route (/auth/me) accepts requests with valid token and returns user details", async () => {
    const loginRes = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: "testuser1@example.com",
        password: "password123",
      },
    });
    const token = loginRes.data.token;

    const res = await apiRequest("/auth/me", {
      method: "GET",
      token,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.user.email, "testuser1@example.com");
  });
});
