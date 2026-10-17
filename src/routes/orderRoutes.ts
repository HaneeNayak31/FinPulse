import { Router } from "express";
import authenticate from "../middleware/auth";
import {
  createOrderHandler,
  getOrdersHandler,
} from "../controllers/orderController";

const router = Router({ mergeParams: true });

router.post("/", authenticate, createOrderHandler);
router.get("/", authenticate, getOrdersHandler);

export default router;
