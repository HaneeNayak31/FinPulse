import express, { Request, Response } from "express";
import portfolioEventsRouter from "./routes/portfolioEvents";
import authRoutes from "./routes/authRoutes";
import assetRoutes from "./routes/assetRoutes";
import portfolioRoutes from "./routes/portfolioRoutes";
import { corsMiddleware } from "./middleware/cors";
import pool from "./db";

const app = express();

// Trust front-end reverse proxies (Vite, Nginx, Docker)
app.set("trust proxy", 1);

// Global CORS handling
app.use(corsMiddleware);

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "FinPulse API is running",
  });
});

app.get("/health/ready", async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ message: "FinPulse API is ready", database: "connected" });
  } catch (error) {
    console.error("Readiness check failed:", error);
    return res.status(503).json({ message: "Database unavailable" });
  }
});

// Modular Routes
app.use("/auth", authRoutes);
app.use("/assets", assetRoutes);
app.use("/portfolios", portfolioRoutes);
app.use("/portfolios", portfolioEventsRouter);

export default app;
