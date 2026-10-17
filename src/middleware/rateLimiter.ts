import { Request, Response, NextFunction } from "express";
import env from "../config/env";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRecords = new Map<string, RateLimitRecord>();

export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  // In test environment: default to 50 requests per 60 seconds unless overridden
  // In production/dev: default to 20 requests per 15 minutes per IP
  const defaultWindow = env.nodeEnv === "test" ? 60 * 1000 : 15 * 60 * 1000;
  const defaultMax = env.nodeEnv === "test" ? 50 : 20;

  const windowMs = options.windowMs ?? defaultWindow;
  const maxRequests = options.maxRequests ?? defaultMax;
  const message =
    options.message ?? "Too many authentication requests, please try again later";

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    // Determine client IP address respecting reverse proxies
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const record = ipRecords.get(clientIp);

    if (!record || now > record.resetTime) {
      ipRecords.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        message,
        retryAfter: retryAfterSeconds,
      });
    }

    return next();
  };
}

export function resetRateLimits() {
  ipRecords.clear();
}

// Default export is the pre-configured auth rate limiter
export const authRateLimiter = createRateLimiter();
export default authRateLimiter;
