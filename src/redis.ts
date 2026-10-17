import Redis from "ioredis";
import env from "./config/env";

const redis = new Redis(env.redisUrl);

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});
export default redis;

export const subscriber = new Redis(env.redisUrl);

subscriber.on("connect", () => console.log("Redis subscriber connected"));

subscriber.on("error", (error) =>
  console.error("Redis subscriber connection error:", error),
);
