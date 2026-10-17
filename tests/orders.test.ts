import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, apiRequest } from "./testHelper";

describe("Phase 3: Order Validation, Execution, and Authorization Tests", () => {
  let user1Token: string;
  let user2Token: string;
  let portfolio1Id: number;
  let portfolio2Id: number;

  before(async () => {
    await startTestServer();

    // Register User 1
    const u1 = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        username: "trader_one",
        email: "trader1@test.com",
        password: "password123",
      },
    });
    const l1 = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "trader1@test.com", password: "password123" },
    });
    user1Token = l1.data.token;

    // Register User 2
    const u2 = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        username: "trader_two",
        email: "trader2@test.com",
        password: "password123",
      },
    });
    const l2 = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "trader2@test.com", password: "password123" },
    });
    user2Token = l2.data.token;

    // Create Portfolio for User 1
    const p1 = await apiRequest("/portfolios", {
      method: "POST",
      token: user1Token,
      body: { name: "Trader1 Main Portfolio" },
    });
    portfolio1Id = p1.data.portfolio.id;

    // Create Portfolio for User 2
    const p2 = await apiRequest("/portfolios", {
      method: "POST",
      token: user2Token,
      body: { name: "Trader2 Hedge Portfolio" },
    });
    portfolio2Id = p2.data.portfolio.id;
  });

  after(async () => {
    await stopTestServer();
  });

  test("GET /portfolios returns consistent portfolios and portfolio array keys", async () => {
    const res = await apiRequest("/portfolios", {
      method: "GET",
      token: user1Token,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.portfolios), "portfolios must be an array");
    assert.ok(Array.isArray(res.data.portfolio), "portfolio must be an array for backwards compatibility");
    assert.equal(res.data.portfolios.length, 1);
    assert.equal(res.data.portfolios[0].id, portfolio1Id);
  });

  test("GET /portfolios/:id returns consistent portfolio and portfolios object keys", async () => {
    const res = await apiRequest(`/portfolios/${portfolio1Id}`, {
      method: "GET",
      token: user1Token,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.portfolio.id, portfolio1Id);
    assert.equal(res.data.portfolios.id, portfolio1Id);
    assert.equal(res.data.portfolio.name, "Trader1 Main Portfolio");
  });

  test("Order rejects invalid portfolio ID (400)", async () => {
    const res = await apiRequest("/portfolios/abc/orders", {
      method: "POST",
      token: user1Token,
      body: { asset_id: 1, quantity: 10, type: "BUY" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.error, "INVALID_PORTFOLIO_ID");
  });

  test("Order rejects invalid asset ID (400)", async () => {
    const res = await apiRequest(`/portfolios/${portfolio1Id}/orders`, {
      method: "POST",
      token: user1Token,
      body: { asset_id: -1, quantity: 10, type: "BUY" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.error, "INVALID_ASSET_ID");
  });

  test("Order rejects non-positive quantity (400)", async () => {
    const res = await apiRequest(`/portfolios/${portfolio1Id}/orders`, {
      method: "POST",
      token: user1Token,
      body: { asset_id: 1, quantity: 0, type: "BUY" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.error, "INVALID_QUANTITY");
  });

  test("Order rejects invalid order type (400)", async () => {
    const res = await apiRequest(`/portfolios/${portfolio1Id}/orders`, {
      method: "POST",
      token: user1Token,
      body: { asset_id: 1, quantity: 5, type: "SHORT" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.error, "INVALID_ORDER_TYPE");
  });

  test("Order rejects access to another user's portfolio with 403 Forbidden", async () => {
    const res = await apiRequest(`/portfolios/${portfolio2Id}/orders`, {
      method: "POST",
      token: user1Token,
      body: { asset_id: 1, quantity: 5, type: "BUY" },
    });
    assert.equal(res.status, 403);
    assert.equal(res.data.error, "FORBIDDEN");
  });

  test("Order on non-existent portfolio returns 404 Portfolio not found", async () => {
    const res = await apiRequest("/portfolios/99999/orders", {
      method: "POST",
      token: user1Token,
      body: { asset_id: 1, quantity: 5, type: "BUY" },
    });
    assert.equal(res.status, 404);
    assert.equal(res.data.error, "PORTFOLIO_NOT_FOUND");
  });

  test("Valid BUY order creates order record and initializes holdings", async () => {
    const res = await apiRequest(`/portfolios/${portfolio1Id}/orders`, {
      method: "POST",
      token: user1Token,
      body: { asset_id: 1, quantity: 10, type: "BUY" },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.order.type, "BUY");
    assert.equal(Number(res.data.order.quantity), 10);

    // Verify holdings
    const hRes = await apiRequest(`/portfolios/${portfolio1Id}/holdings`, {
      method: "GET",
      token: user1Token,
    });
    assert.equal(hRes.status, 200);
    assert.equal(hRes.data.holdings.length, 1);
    const h = hRes.data.holdings[0];
    assert.equal(h.symbol, "AAPL");
    assert.equal(Number(h.quantity), 10);
    assert.equal(Number(h.average_price), 150);
  });

  test("Selling asset not owned fails with 400 HOLDING_NOT_FOUND", async () => {
    // Asset 2 is MSFT which trader1 does not own yet
    const res = await apiRequest(`/portfolios/${portfolio1Id}/orders`, {
      method: "POST",
      token: user1Token,
      body: { asset_id: 2, quantity: 1, type: "SELL" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.error, "HOLDING_NOT_FOUND");
  });

  test("Overselling (selling more than owned quantity) fails with 400 INSUFFICIENT_HOLDINGS", async () => {
    // Trader1 owns 10 AAPL, attempts to sell 15
    const res = await apiRequest(`/portfolios/${portfolio1Id}/orders`, {
      method: "POST",
      token: user1Token,
      body: { asset_id: 1, quantity: 15, type: "SELL" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.error, "INSUFFICIENT_HOLDINGS");

    // Verify holding was NOT touched
    const hRes = await apiRequest(`/portfolios/${portfolio1Id}/holdings`, {
      method: "GET",
      token: user1Token,
    });
    assert.equal(Number(hRes.data.holdings[0].quantity), 10);
  });

  test("Valid SELL order decreases holding quantity correctly", async () => {
    // Sell 4 of 10 AAPL
    const res = await apiRequest(`/portfolios/${portfolio1Id}/orders`, {
      method: "POST",
      token: user1Token,
      body: { asset_id: 1, quantity: 4, type: "SELL" },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.order.type, "SELL");

    // Verify remaining holding is exactly 6
    const hRes = await apiRequest(`/portfolios/${portfolio1Id}/holdings`, {
      method: "GET",
      token: user1Token,
    });
    assert.equal(Number(hRes.data.holdings[0].quantity), 6);
  });

  test("Order history pagination returns correctly paged and formatted orders", async () => {
    const res = await apiRequest(`/portfolios/${portfolio1Id}/orders?page=1&limit=1`, {
      method: "GET",
      token: user1Token,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.page, 1);
    assert.equal(res.data.limit, 1);
    assert.equal(res.data.orders.length, 1);
    // Most recent was the SELL order
    assert.equal(res.data.orders[0].type, "SELL");

    // Fetch page 2
    const p2 = await apiRequest(`/portfolios/${portfolio1Id}/orders?page=2&limit=1`, {
      method: "GET",
      token: user1Token,
    });
    assert.equal(p2.status, 200);
    assert.equal(p2.data.orders.length, 1);
    // Previous order was the BUY order
    assert.equal(p2.data.orders[0].type, "BUY");
  });
});
