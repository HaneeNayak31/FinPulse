import Redis, { RedisOptions } from "ioredis";
import env from "./config/env";

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  enableReadyCheck: false,
  autoResubscribe: true,
  lazyConnect: false,
  // Redis is an optional acceleration/realtime layer. Do not keep a backend
  // process alive indefinitely trying to reconnect to an unavailable service.
  retryStrategy: () => null,
};

const redis = new Redis(env.redisUrl, redisOptions);

let redisConnected = false;
let lastRedisErrorLog = 0;

redis.on("connect", () => {
  if (!redisConnected) {
    redisConnected = true;
    console.log("Redis connected");
  }
});

redis.on("error", (error) => {
  redisConnected = false;
  const now = Date.now();
  if (now - lastRedisErrorLog > 10000) {
    lastRedisErrorLog = now;
    console.warn("[Redis] Optional cache service not connected. Continuing in standalone database mode.");
  }
});

export default redis;

export const subscriber = new Redis(env.redisUrl, redisOptions);

let subscriberConnected = false;
let lastSubErrorLog = 0;

subscriber.on("connect", () => {
  if (!subscriberConnected) {
    subscriberConnected = true;
    console.log("Redis subscriber connected");
  }
});

subscriber.on("error", (error) => {
  subscriberConnected = false;
  const now = Date.now();
  if (now - lastSubErrorLog > 10000) {
    lastSubErrorLog = now;
    console.warn("[Redis Subscriber] Optional market broadcast service not connected. Continuing.");
  }
});
