import express, { Request, Response } from "express";
import portfolioEventsRouter from "./routes/portfolioEvents";
import authRoutes from "./routes/authRoutes";
import assetRoutes from "./routes/assetRoutes";
import portfolioRoutes from "./routes/portfolioRoutes";
import { corsMiddleware } from "./middleware/cors";

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

// Modular Routes
app.use("/auth", authRoutes);
app.use("/assets", assetRoutes);
app.use("/portfolios", portfolioRoutes);
app.use("/portfolios", portfolioEventsRouter);

export default app;
