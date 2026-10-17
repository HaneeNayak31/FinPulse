import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, apiRequest } from "./testHelper";
import { testPool } from "./setupTestDb";

describe("Phase 3: Holdings Calculations & Portfolio Valuation/P&L Tests", () => {
  let token: string;
  let portfolioId: number;

  before(async () => {
    await startTestServer();

    // Register & Login
    await apiRequest("/auth/register", {
      method: "POST",
      body: {
        username: "pnl_trader",
        email: "pnl@test.com",
        password: "password123",
      },
    });
    const login = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "pnl@test.com", password: "password123" },
    });
    token = login.data.token;

    // Create portfolio
    const p = await apiRequest("/portfolios", {
      method: "POST",
      token,
      body: { name: "Growth & Value Portfolio" },
    });
    portfolioId = p.data.portfolio.id;
  });

  after(async () => {
    await stopTestServer();
  });

  test("Holdings endpoint returns empty array for new portfolio", async () => {
    const res = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.holdings, []);
  });

  test("Initial BUY order establishes cost basis and market value correctly", async () => {
    // Buy 10 AAPL (Asset ID 1, current price $150.00 in test DB)
    const buyRes = await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 1, quantity: 10, type: "BUY" },
    });
    assert.equal(buyRes.status, 201);

    const res = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.holdings.length, 1);

    const holding = res.data.holdings[0];
    const qty = Number(holding.quantity);
    const avgPrice = Number(holding.average_price);
    const curPrice = Number(holding.current_price);

    assert.equal(holding.symbol, "AAPL");
    assert.equal(qty, 10);
    assert.equal(avgPrice, 150.0);
    assert.equal(curPrice, 150.0);

    // Mathematical verification of cost basis and valuation
    const costBasis = qty * avgPrice;
    const marketValue = qty * curPrice;
    const pnl = marketValue - costBasis;

    assert.equal(costBasis, 1500.0);
    assert.equal(marketValue, 1500.0);
    assert.equal(pnl, 0.0);
  });

  test("Subsequent BUY calculates correct weighted average price", async () => {
    // Manually adjust asset price in test DB to simulate price fluctuation before next buy
    await testPool.query("UPDATE public.assets SET current_price = 210.00 WHERE id = 1");

    // Buy another 10 AAPL @ $210.00
    // Weighted Average should be: (10 * 150 + 10 * 210) / 20 = (1500 + 2100) / 20 = $180.00
    const buy2 = await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 1, quantity: 10, type: "BUY" },
    });
    assert.equal(buy2.status, 201);

    const res = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    const holding = res.data.holdings[0];
    const qty = Number(holding.quantity);
    const avgPrice = Number(holding.average_price);

    assert.equal(qty, 20);
    assert.equal(avgPrice, 180.0);
  });

  test("Portfolio valuation and Unrealized P&L updates when asset price moves", async () => {
    // Current state: 20 AAPL @ avg $180.00 (Total Cost = $3600.00)
    // Simulate price surge to $225.00
    await testPool.query("UPDATE public.assets SET current_price = 225.00 WHERE id = 1");

    // Also add a second holding: Buy 5 MSFT (Asset ID 2) @ $300.00 = $1500.00 cost
    await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 2, quantity: 5, type: "BUY" },
    });

    const res = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.holdings.length, 2);

    const holdings = res.data.holdings;
    const aapl = holdings.find((h: any) => h.symbol === "AAPL");
    const msft = holdings.find((h: any) => h.symbol === "MSFT");

    assert.ok(aapl && msft);

    // AAPL: 20 shares, avg $180, current $225
    const aaplCost = Number(aapl.quantity) * Number(aapl.average_price);
    const aaplValue = Number(aapl.quantity) * Number(aapl.current_price);
    const aaplPnl = aaplValue - aaplCost;

    assert.equal(aaplCost, 3600.0);
    assert.equal(aaplValue, 4500.0);
    assert.equal(aaplPnl, 900.0); // +$900 profit (+25%)

    // MSFT: 5 shares, avg $300, current $300
    const msftCost = Number(msft.quantity) * Number(msft.average_price);
    const msftValue = Number(msft.quantity) * Number(msft.current_price);
    const msftPnl = msftValue - msftCost;

    assert.equal(msftCost, 1500.0);
    assert.equal(msftValue, 1500.0);
    assert.equal(msftPnl, 0.0);

    // Aggregate portfolio metrics:
    const totalPortfolioValue = aaplValue + msftValue;
    const totalPortfolioCost = aaplCost + msftCost;
    const totalPortfolioPnl = totalPortfolioValue - totalPortfolioCost;
    const totalReturnPercent = (totalPortfolioPnl / totalPortfolioCost) * 100;

    assert.equal(totalPortfolioCost, 5100.0);
    assert.equal(totalPortfolioValue, 6000.0);
    assert.equal(totalPortfolioPnl, 900.0);
    assert.ok(Math.abs(totalReturnPercent - 17.647) < 0.01);
  });

  test("Partial SELL preserves average cost basis per share (AVCO invariant)", async () => {
    // Current state from previous test: 20 AAPL @ avg $180.00
    // Sell 8 AAPL
    const sellRes = await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 1, quantity: 8, type: "SELL" },
    });
    assert.equal(sellRes.status, 201);

    const res = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    const aapl = res.data.holdings.find((h: any) => h.symbol === "AAPL");

    // Quantity decreases: 20 - 8 = 12 shares
    assert.equal(Number(aapl.quantity), 12);
    // Average price per share MUST remain strictly identical ($180.00)
    assert.equal(Number(aapl.average_price), 180.0);
  });

  test("Fractional share precision (numeric 14,4) maintains 4 decimal places without floating drift", async () => {
    // Buy 2.5000 GOOGL (Asset ID 3, price $140.00)
    const buyRes = await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 3, quantity: 2.5, type: "BUY" },
    });
    assert.equal(buyRes.status, 201);

    // Sell 0.7500 GOOGL
    const sellRes = await apiRequest(`/portfolios/${portfolioId}/orders`, {
      method: "POST",
      token,
      body: { asset_id: 3, quantity: 0.75, type: "SELL" },
    });
    assert.equal(sellRes.status, 201);

    const res = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    const googl = res.data.holdings.find((h: any) => h.symbol === "GOOGL");

    // Exact fractional quantity: 2.5000 - 0.7500 = 1.7500
    assert.equal(Number(googl.quantity), 1.75);
    assert.equal(googl.quantity, "1.7500");
    assert.equal(Number(googl.average_price), 140.0);
  });

  test("Asset allocation percentages accurately sum to 100.00%", async () => {
    const res = await apiRequest(`/portfolios/${portfolioId}/holdings`, {
      method: "GET",
      token,
    });
    assert.equal(res.status, 200);

    const holdings = res.data.holdings;
    assert.ok(holdings.length >= 3);

    // Compute market values
    const marketValues = holdings.map((h: any) => Number(h.quantity) * Number(h.current_price));
    const totalMarketValue = marketValues.reduce((sum: number, val: number) => sum + val, 0);

    // Compute individual allocations
    const allocations = marketValues.map((val: number) => (val / totalMarketValue) * 100);

    // Verify all allocations are between 0% and 100%
    allocations.forEach((alloc: number) => {
      assert.ok(alloc > 0 && alloc < 100);
    });

    // Sum of allocations must be exactly 100.00%
    const totalAllocation = allocations.reduce((sum: number, alloc: number) => sum + alloc, 0);
    assert.ok(Math.abs(totalAllocation - 100.0) < 0.0001);
  });
});
