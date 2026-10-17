import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import app from "./app";
import env from "./config/env";
import pool, { testDatabaseConnection } from "./db";
import redis, { subscriber } from "./redis";

const server = createServer(app);
const wss = new WebSocketServer({ server });
const clientSubscriptions = new Map<WebSocket, Set<string>>();

wss.on("connection", function (ws) {
  console.log("WebSocket client connected");
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

        const subscriptions = clientSubscriptions.get(ws);

        if (message.type === "SUBSCRIBE") {
          subscriptions?.add(symbol);
          console.log(`Client subscribed to ${symbol}`);
        } else {
          subscriptions?.delete(symbol);
          console.log(`Client unsubscribed from ${symbol}`);
        }
      }
    } catch (error) {
      clientSubscriptions.delete(ws);
      console.error("Invalid WebSocket message");
    }
  });

  ws.on("error", console.error);

  ws.on("close", function () {
    clientSubscriptions.delete(ws);
    console.log("WebSocket client disconnected");
  });
});

subscriber.on("message", (channel, message) => {
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
  } catch (error) {
    console.error("Invalid price event received from Redis");
  }
});

const PORT = env.port;

server.listen(PORT, async () => {
  console.log(`FinPulse server running on port ${PORT}`);
  try {
    await testDatabaseConnection();
  } catch (err) {
    console.error("Database connection check failed on startup:", err);
  }
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  wss.clients.forEach((client) => {
    client.close(1001, "Server shutting down");
  });

  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      await pool.end();
      console.log("Database pool disconnected.");
    } catch (err) {
      console.error("Error closing database pool:", err);
    }

    try {
      subscriber.disconnect();
      redis.disconnect();
      console.log("Redis connections closed.");
    } catch (err) {
      console.error("Error closing Redis connections:", err);
    }

    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forceful shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { server, app };
