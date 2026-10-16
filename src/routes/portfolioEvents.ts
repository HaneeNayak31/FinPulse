import { Router, Request, Response } from "express";
import { subscriber } from "../redis";
import authenticate from "../middleware/auth";
import pool from "../db";

const router = Router();
const clients = new Set<Response>();

subscriber.on("message", (channel, message) => {
  if (channel !== "market:prices") return;

  for (const client of clients) {
    client.write(`data: ${message}\n\n`);
  }
});
subscriber.subscribe("market:prices");
const portfolioEventsRouter = router.get(
  "/:id/events",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const portfolioId = Number(req.params.id);
      const userId = res.locals.user.id;

      if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
        return res.status(400).json({ message: "Invalid portfolio ID" });
      }

      const result = await pool.query(
        "SELECT id FROM portfolios WHERE id = $1 AND user_id = $2",
        [portfolioId, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write("data: Connected to FinPulse SSE\n\n");
      clients.add(res);
      req.on("close", () => {
        clients.delete(res);
        console.log("SSE client disconnected");
      });
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  },
);

export default portfolioEventsRouter;
