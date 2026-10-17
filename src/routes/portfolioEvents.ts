import { Router, Request, Response } from "express";
import { subscriber } from "../redis";
import authenticate from "../middleware/auth";
import pool from "../db";

const router = Router();

export interface SSEClientInfo {
  portfolioId: number;
  userId: number;
  heldSymbols: Set<string>;
}

export const sseClients = new Map<Response, SSEClientInfo>();

// Listen to market:prices from Redis and dispatch ONLY to clients holding the symbol
subscriber.on("message", (channel, message) => {
  if (channel !== "market:prices") return;

  try {
    const event = JSON.parse(message);
    const symbol = event.symbol?.toUpperCase();
    if (!symbol) return;

    for (const [clientRes, clientInfo] of sseClients) {
      // Deliver only if the portfolio actually holds this asset
      if (clientInfo.heldSymbols.has(symbol)) {
        clientRes.write(`data: ${message}\n\n`);
      }
    }
  } catch (error) {
    console.error("Error dispatching SSE event:", error);
  }
});

subscriber.subscribe("market:prices");

/**
 * Dynamically update or refresh held symbols for all active SSE connections
 * of a portfolio when buy/sell orders change holdings.
 */
export function updatePortfolioHeldSymbols(
  portfolioId: number,
  symbol: string,
  hasHolding: boolean,
) {
  const sym = symbol.toUpperCase();
  for (const [_, clientInfo] of sseClients) {
    if (clientInfo.portfolioId === portfolioId) {
      if (hasHolding) {
        clientInfo.heldSymbols.add(sym);
      } else {
        clientInfo.heldSymbols.delete(sym);
      }
    }
  }
}

router.get("/:id/events", authenticate, async (req: Request, res: Response) => {
  try {
    const portfolioId = Number(req.params.id);
    const userId = res.locals.user.id;

    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
      return res.status(400).json({
        error: "INVALID_PORTFOLIO_ID",
        message: "Invalid portfolio ID",
      });
    }

    // 1. Verify portfolio existence and ownership
    const portfolioResult = await pool.query<{ id: number; user_id: number }>(
      "SELECT id, user_id FROM portfolios WHERE id = $1",
      [portfolioId],
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({
        error: "PORTFOLIO_NOT_FOUND",
        message: "Portfolio not found",
      });
    }

    if (portfolioResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Not authorized",
      });
    }

    // 2. Fetch initial held symbols for this portfolio (where quantity > 0)
    const holdingsResult = await pool.query<{ symbol: string }>(
      `SELECT a.symbol
       FROM holdings h
       JOIN assets a ON h.asset_id = a.id
       WHERE h.portfolio_id = $1 AND h.quantity > 0`,
      [portfolioId],
    );

    const heldSymbols = new Set<string>(
      holdingsResult.rows.map((r) => r.symbol.toUpperCase()),
    );

    // 3. Establish SSE Stream Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // 4. Send initial connection confirmation handshake
    res.write("data: Connected to FinPulse SSE\n\n");

    // 5. Register active client with its held symbols
    sseClients.set(res, {
      portfolioId,
      userId,
      heldSymbols,
    });

    // 6. Handle client disconnect and errors safely
    req.on("close", () => {
      sseClients.delete(res);
    });

    res.on("error", (err) => {
      sseClients.delete(res);
      console.error(`SSE stream error for portfolio ${portfolioId}:`, err);
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  }
});

export default router;
