import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import app from "../src/app";
import redis, { subscriber } from "../src/redis";
import priceSimulator from "../src/services/priceSimulator";
import { apiRequest } from "./testHelper";
import { testPool, cleanTestDb, initTestDb } from "./setupTestDb";

describe("Phase 5: Real-Time Price Simulation, Pub/Sub, WebSocket & SSE Pipeline", () => {
  let server: Server;
  let wss: WebSocketServer;
  let port: number;
  let token: string;
  let portfolioId: number;
  const clientSubscriptions = new Map<WebSocket, Set<string>>();

  before(async () => {
    await initTestDb();
    await cleanTestDb();

    // Create HTTP + WebSocket server identical to server.ts
    server = createServer(app);
    wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
      clientSubscriptions.set(ws, new Set<string>());

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (
            (message.type === "SUBSCRIBE" || message.type === "UNSUBSCRIBE") &&
            typeof message.symbol === "string"
          ) {
            const symbol = message.symbol.trim().toUpperCase();
            if (!symbol) return;
            const subs = clientSubscriptions.get(ws);
            if (message.type === "SUBSCRIBE") {
              subs?.add(symbol);
            } else {
              subs?.delete(symbol);
            }
          }
        } catch (err) {}
      });

      ws.on("close", () => {
        clientSubscriptions.delete(ws);
      });
    });

    // Redis market:prices subscriber forwarding to matching WebSocket subscriptions
    const subHandler = (channel: string, message: string) => {
      if (channel !== "market:prices") return;
      try {
        const event = JSON.parse(message);
        const symbol = event.symbol?.toUpperCase();
        if (!symbol) return;

        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            clientSubscriptions.get(client)?.has(symbol)
          ) {
            client.send(message);
          }
        });
      } catch (err) {}
    };

    subscriber.on("message", subHandler);
    await subscriber.subscribe("market:prices");

    // Start ephemeral server
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          port = addr.port;
        }
        resolve();
      });
    });

    // Create user & portfolio for SSE testing
    const u = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "stream_user",
        email: "stream@test.com",
        password: "password123",
      }),
    });
    const uData: any = await u.json();

    const l = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "stream@test.com",
        password: "password123",
      }),
    });
    const lData: any = await l.json();
    token = lData.token;

    const p = await fetch(`http://127.0.0.1:${port}/portfolios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "Realtime Portfolio" }),
    });
    const pData: any = await p.json();
    portfolioId = pData.portfolio.id;
  });

  after(async () => {
    wss.clients.forEach((ws) => ws.close());
    wss.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
      await testPool.end();
    } catch {}
    try {
      redis.disconnect();
      subscriber.disconnect();
    } catch {}
  });

  test("WebSocket receives PRICE_UPDATED event when subscribed symbol price updates", async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);

    await new Promise<void>((resolve) => ws.on("open", () => resolve()));

    // Subscribe to AAPL
    ws.send(JSON.stringify({ type: "SUBSCRIBE", symbol: "AAPL" }));
    // Wait briefly for server to register subscription
    await new Promise((r) => setTimeout(r, 50));

    // Listen for incoming message
    const messagePromise = new Promise<any>((resolve) => {
      ws.on("message", (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    // Trigger price update via priceSimulator
    const updatedAsset = await priceSimulator("AAPL");

    const receivedEvent = await messagePromise;

    assert.equal(receivedEvent.event, "PRICE_UPDATED");
    assert.equal(receivedEvent.symbol, "AAPL");
    assert.equal(Number(receivedEvent.price), Number(updatedAsset.current_price));
    assert.ok(receivedEvent.timestamp);

    ws.close();
  });

  test("WebSocket does NOT receive events for unsubscribed symbols", async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((resolve) => ws.on("open", () => resolve()));

    // Subscribe to GOOGL only
    ws.send(JSON.stringify({ type: "SUBSCRIBE", symbol: "GOOGL" }));
    await new Promise((r) => setTimeout(r, 50));

    let receivedUnwanted = false;
    ws.on("message", () => {
      receivedUnwanted = true;
    });

    // Trigger price update for MSFT (not subscribed)
    await priceSimulator("MSFT");

    await new Promise((r) => setTimeout(r, 100));
    assert.equal(receivedUnwanted, false, "Should not receive events for unsubscribed symbols");

    ws.close();
  });

  test("SSE rejects unauthorized cross-user access with 403 Forbidden", async () => {
    // Register another user
    const u2 = await fetch(`http://127.0.0.1:${port}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "hacker_user",
        email: "hacker@test.com",
        password: "password123",
      }),
    });
    const l2 = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "hacker@test.com",
        password: "password123",
      }),
    });
    const l2Data: any = await l2.json();
    const attackerToken = l2Data.token;

    // Attempt to access portfolioId belonging to stream_user
    const res = await fetch(
      `http://127.0.0.1:${port}/portfolios/${portfolioId}/events`,
      {
        headers: { Authorization: `Bearer ${attackerToken}` },
      },
    );
    assert.equal(res.status, 403);
    const data: any = await res.json();
    assert.equal(data.error, "FORBIDDEN");
  });

  test("SSE rejects non-existent portfolio with 404 Not Found", async () => {
    const res = await fetch(
      `http://127.0.0.1:${port}/portfolios/99999/events`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    assert.equal(res.status, 404);
  });

  test("SSE delivers connection handshake and scopes events ONLY to held assets", async () => {
    // Buy 10 AAPL into the portfolio so AAPL is a held asset
    await fetch(`http://127.0.0.1:${port}/portfolios/${portfolioId}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ asset_id: 1, quantity: 10, type: "BUY" }),
    });

    let receivedData = "";
    const http = await import("http");

    await new Promise<void>((resolve, reject) => {
      const sseReq = http.get(
        `http://127.0.0.1:${port}/portfolios/${portfolioId}/events`,
        { headers: { Authorization: `Bearer ${token}` } },
        async (res) => {
          assert.equal(res.statusCode, 200);
          assert.match(res.headers["content-type"] || "", /text\/event-stream/);

          res.on("data", (chunk) => {
            receivedData += chunk.toString();
          });

          // 1. Wait for handshake
          while (!receivedData.includes("Connected to FinPulse SSE")) {
            await new Promise((r) => setTimeout(r, 20));
          }

          // 2. Trigger price tick for MSFT (NOT held by this portfolio)
          await priceSimulator("MSFT");
          await new Promise((r) => setTimeout(r, 100));

          assert.equal(
            receivedData.includes("MSFT"),
            false,
            "SSE must filter out MSFT because it is not held",
          );

          // 3. Trigger price tick for AAPL (HELD by this portfolio)
          await priceSimulator("AAPL");

          const start = Date.now();
          while (!receivedData.includes("AAPL") && Date.now() - start < 2000) {
            await new Promise((r) => setTimeout(r, 20));
          }

          assert.ok(
            receivedData.includes("PRICE_UPDATED") && receivedData.includes("AAPL"),
            "SSE must receive AAPL tick",
          );

          sseReq.destroy();
          resolve();
        },
      );
      sseReq.on("error", (err) => {
        // Destroy causes abort/error which is expected upon cleanup
        resolve();
      });
    });
  });

  test("Missed-Event Recovery: Reconnecting client retrieves fresh state via REST after disconnection", async () => {
    // 1. Client disconnects
    // 2. Market undergoes multiple ticks while client is offline
    await priceSimulator("TSLA");
    const lastTick = await priceSimulator("TSLA");

    // 3. Client reconnects and queries REST endpoint to recover ground truth
    const res = await fetch(`http://127.0.0.1:${port}/assets/TSLA`);
    const data: any = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(Number(data.asset.current_price), Number(lastTick.current_price));
  });
});
