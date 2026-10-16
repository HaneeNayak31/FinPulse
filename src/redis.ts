import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});
export default redis;

export const subscriber = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
);

subscriber.on("connect", () => console.log("Redis subscriber connected"));

subscriber.on("error", (error) =>
  console.error("Redis subscriber connection error:", error),
);
