import { Router } from "express";
import authenticate from "../middleware/auth";
import {
  listPortfoliosHandler,
  createPortfolioHandler,
  getPortfolioHandler,
  getHoldingsHandler,
} from "../controllers/portfolioController";
import orderRoutes from "./orderRoutes";

const router = Router();

router.get("/", authenticate, listPortfoliosHandler);
router.post("/", authenticate, createPortfolioHandler);
router.get("/:id", authenticate, getPortfolioHandler);
router.get("/:id/holdings", authenticate, getHoldingsHandler);

// Sub-routes for orders
router.use("/:id/orders", orderRoutes);

export default router;
