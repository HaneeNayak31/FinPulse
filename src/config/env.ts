import "dotenv/config";

export interface Config {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  nodeEnv: string;
  corsOrigins: string[];
}

function validateEnv(): Config {
  const port = Number(process.env.PORT) || 4000;
  const nodeEnv = process.env.NODE_ENV || "development";
  const rawDb = process.env.DATABASE_URL || "";
  const databaseUrl =
    nodeEnv === "test"
      ? (process.env.TEST_DATABASE_URL || rawDb.replace(/\/[^/?]+(\?.*)?$/, "/finpulse_test$1"))
      : rawDb;
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const jwtSecret = process.env.JWT_SECRET;
  const defaultCorsOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://fin-pulse-lime.vercel.app",
  ];
  const configuredCorsOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const corsOrigins = [...new Set([...defaultCorsOrigins, ...configuredCorsOrigins])];

  const missing: string[] = [];
  if (!databaseUrl) missing.push("DATABASE_URL");
  if (!jwtSecret) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    const errorMsg = `[Config Error] Missing required environment variables: ${missing.join(", ")}`;
    console.error(errorMsg);
    if (nodeEnv === "production") {
      throw new Error(errorMsg);
    }
  }

  return {
    port,
    databaseUrl: databaseUrl || "",
    redisUrl,
    jwtSecret: jwtSecret || "",
    nodeEnv,
    corsOrigins,
  };
}

export const env = validateEnv();
export default env;
