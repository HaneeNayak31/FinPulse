import { createServer, Server } from "http";
import "dotenv/config";

const rawDbUrl = process.env.DATABASE_URL || "";
export const TEST_DB_URL = rawDbUrl.replace(
  /\/[^/?]+(\?.*)?$/,
  "/finpulse_test$1",
);

process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL = TEST_DB_URL;

import { testPool, cleanTestDb, initTestDb } from "./setupTestDb";
import app from "../src/app";

import redis, { subscriber } from "../src/redis";
import pool from "../src/db";

let server: Server | null = null;
let baseUrl = "";

export async function startTestServer(): Promise<string> {
  await initTestDb();
  await cleanTestDb();

  return new Promise((resolve, reject) => {
    server = createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const addr = server?.address();
      if (addr && typeof addr === "object") {
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve(baseUrl);
      } else {
        reject(new Error("Failed to get server address"));
      }
    });
  });
}

export async function stopTestServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
  try {
    await pool.end();
  } catch {}
  try {
    await testPool.end();
  } catch {}
  try {
    redis.disconnect();
    subscriber.disconnect();
  } catch {}
}

export function getBaseUrl(): string {
  return baseUrl;
}

export async function apiRequest(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; data: any; headers: Headers }> {
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const reqHeaders: Record<string, string> = {
    ...options.headers,
  };

  if (options.token) {
    reqHeaders["Authorization"] = `Bearer ${options.token}`;
  }

  let bodyStr: string | undefined;
  if (options.body !== undefined) {
    reqHeaders["Content-Type"] = "application/json";
    bodyStr = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: reqHeaders,
    body: bodyStr,
  });

  let data: any;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    data,
    headers: res.headers,
  };
}
