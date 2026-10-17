import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, apiRequest } from "./testHelper";
import redis from "../src/redis";

describe("Phase 3: Redis Caching and Invalidation Tests", () => {
  before(async () => {
    await startTestServer();
    // Flush test redis keys before running
    await redis.del("assets:all", "asset:AAPL", "asset:MSFT");
  });

  after(async () => {
    await redis.del("assets:all", "asset:AAPL", "asset:MSFT");
    await stopTestServer();
  });

  test("GET /assets populates Redis cache on MISS and serves from cache on HIT", async () => {
    // 1. Ensure key does not exist initially
    await redis.del("assets:all");
    const existsBefore = await redis.exists("assets:all");
    assert.equal(existsBefore, 0);

    // 2. First request (Cache MISS)
    const res1 = await apiRequest("/assets");
    assert.equal(res1.status, 200);
    assert.equal(res1.data.success, true);
    assert.ok(res1.data.assets.length > 0);

    // 3. Verify Redis key is now cached
    const cachedData = await redis.get("assets:all");
    assert.ok(cachedData !== null);
    const parsed = JSON.parse(cachedData!);
    assert.equal(parsed.length, res1.data.assets.length);

    // 4. Verify TTL is set (<= 30 seconds)
    const ttl = await redis.ttl("assets:all");
    assert.ok(ttl > 0 && ttl <= 30);

    // 5. Second request (Cache HIT)
    const res2 = await apiRequest("/assets");
    assert.equal(res2.status, 200);
    assert.deepEqual(res2.data.assets, res1.data.assets);
  });

  test("GET /assets/:symbol caches single asset with key asset:<SYMBOL>", async () => {
    await redis.del("asset:AAPL");

    // 1. First request
    const res1 = await apiRequest("/assets/AAPL");
    assert.equal(res1.status, 200);
    assert.equal(res1.data.asset.symbol, "AAPL");

    // 2. Verify Redis key exists
    const cachedAsset = await redis.get("asset:AAPL");
    assert.ok(cachedAsset !== null);
    const parsed = JSON.parse(cachedAsset!);
    assert.equal(parsed.symbol, "AAPL");
    assert.equal(parsed.current_price, res1.data.asset.current_price);

    // 3. TTL is active
    const ttl = await redis.ttl("asset:AAPL");
    assert.ok(ttl > 0 && ttl <= 30);
  });

  test("POST /assets/:symbol/simulate invalidates both asset:<SYMBOL> and assets:all in Redis", async () => {
    // Populate cache first
    await apiRequest("/assets");
    await apiRequest("/assets/AAPL");

    assert.equal(await redis.exists("assets:all"), 1);
    assert.equal(await redis.exists("asset:AAPL"), 1);

    // Call simulate endpoint
    const simRes = await apiRequest("/assets/AAPL/simulate", { method: "POST" });
    assert.equal(simRes.status, 200);
    assert.equal(simRes.data.success, true);
    assert.ok(simRes.data.asset.current_price);

    // Verify cache invalidation: both keys must have been evicted from Redis
    const allExists = await redis.exists("assets:all");
    const aaplExists = await redis.exists("asset:AAPL");

    assert.equal(allExists, 0, "assets:all must be evicted upon price tick");
    assert.equal(aaplExists, 0, "asset:AAPL must be evicted upon price tick");

    // Next request to GET /assets/AAPL returns the freshly updated price
    const freshRes = await apiRequest("/assets/AAPL");
    assert.equal(freshRes.status, 200);
    assert.equal(Number(freshRes.data.asset.current_price), Number(simRes.data.asset.current_price));
  });
});
