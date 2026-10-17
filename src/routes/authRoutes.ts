import { Router } from "express";
import {
  loginHandler,
  registerHandler,
  meHandler,
} from "../controllers/authController";
import authenticate from "../middleware/auth";
import authRateLimiter from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authRateLimiter, registerHandler);
router.post("/login", authRateLimiter, loginHandler);
router.get("/me", authenticate, meHandler);

export default router;
