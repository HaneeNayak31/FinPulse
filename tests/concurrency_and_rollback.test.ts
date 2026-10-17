import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, apiRequest } from "./testHelper";
import { testPool } from "./setupTestDb";

describe("Phase 4: Database Transaction Rollback & Concurrent SELL Safety", () => {
  let token: string;
  let portfolioId: number;

  before(async () => {
    await startTestServer();

    // Register & Login
    await apiRequest("/auth/register", {
      method: "POST",
      body: {
        username: "concurrency_trader",
        email: "concurrency@test.com",
        password: "password123",
      },
    });
    const login = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "concurrency@test.com", password: "password123" },
    });
    token = login.data.token;

    // Create portfolio
    const p = await apiRequest("/portfolios", {
      method: "POST",
      token,
      body: { name: "High Concurrency Portfolio" },
    });
    portfolioId = p.data.portfolio.id;

    // Buy 10 AAPL shares (Asset ID 1)
    const buyRes = await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 1, quantity: 10, type: "BUY" },
    });
    assert.equal(buyRes.status, 201);
  });

  after(async () => {
    await stopTestServer();
  });

  test("Transaction Rollback: Rejections leave holdings and orders untouched", async () => {
    // Current holding: 10 shares of AAPL
    const holdingBefore = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    assert.equal(Number(holdingBefore.data.holdings[0].quantity), 10);

    const ordersBefore = await testPool.query(
      "SELECT count(*) FROM public.orders WHERE portfolio_id = $1",
      [portfolioId],
    );
    const initialOrderCount = Number(ordersBefore.rows[0].count);

    // Attempt invalid oversell of 100 shares
    const failRes = await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 1, quantity: 100, type: "SELL" },
    });
    assert.equal(failRes.status, 400);
    assert.equal(failRes.data.error, "INSUFFICIENT_HOLDINGS");

    // Verify DB state: holding quantity remains exactly 10, no phantom order was committed
    const holdingAfter = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    assert.equal(Number(holdingAfter.data.holdings[0].quantity), 10);

    const ordersAfter = await testPool.query(
      "SELECT count(*) FROM public.orders WHERE portfolio_id = $1",
      [portfolioId],
    );
    assert.equal(Number(ordersAfter.rows[0].count), initialOrderCount);
  });

  test("Pessimistic Locking (FOR UPDATE): Concurrent SELL requests cannot oversell holdings", async () => {
    // Current holding: 10 shares
    // Dispatch two concurrent SELL requests of 7 shares simultaneously
    // Total requested = 14 shares > 10 shares available.
    // In a race condition without locks, both would succeed and leave balance at -4.
    // With FOR UPDATE row lock, exactly ONE must succeed, and the other MUST fail.

    const [resA, resB] = await Promise.all([
      apiRequest(`/portfolios/${portfolioId}/orders`, {
        method: "POST",
        token,
        body: { asset_id: 1, quantity: 7, type: "SELL" },
      }),
      apiRequest(`/portfolios/${portfolioId}/orders`, {
        method: "POST",
        token,
        body: { asset_id: 1, quantity: 7, type: "SELL" },
      }),
    ]);

    const results = [resA, resB];
    const successes = results.filter((r) => r.status === 201);
    const failures = results.filter((r) => r.status === 400);

    assert.equal(successes.length, 1, "Exactly one concurrent SELL order must succeed");
    assert.equal(failures.length, 1, "The second concurrent SELL order must be rejected");
    assert.equal(failures[0].data.error, "INSUFFICIENT_HOLDINGS");

    // Verify holding balance in DB is exactly 3 (10 - 7 = 3)
    const finalHolding = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    assert.equal(Number(finalHolding.data.holdings[0].quantity), 3);
  });

  test("High Concurrency Spike: Multiple parallel orders maintain integrity", async () => {
    // Current holding: 3 shares of AAPL
    // Add 7 more shares so holding is 10 shares
    await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 1, quantity: 7, type: "BUY" },
    });

    // Fire 5 concurrent SELL requests of 3 shares each (Total requested: 15 shares)
    // Only 3 orders can succeed (3 x 3 = 9 shares sold, 1 share remaining)
    // 2 orders must fail with INSUFFICIENT_HOLDINGS
    const requests = Array.from({ length: 5 }, () =>
      apiRequest(`/portfolios/${portfolioId}/orders`, {
        method: "POST",
        token,
        body: { asset_id: 1, quantity: 3, type: "SELL" },
      }),
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter((r) => r.status === 201).length;
    const failureCount = responses.filter((r) => r.status === 400).length;

    assert.equal(successCount, 3, "Only 3 orders of 3 shares can be fulfilled from 10 shares");
    assert.equal(failureCount, 2, "2 orders must be rejected due to insufficient quantity");

    // Final holding must be exactly 1 share remaining
    const holdingRes = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    assert.equal(Number(holdingRes.data.holdings[0].quantity), 1);
  });
});
