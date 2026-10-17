import { Request, Response, NextFunction } from "express";
import env from "../config/env";

export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.headers.origin;

  // If no Origin header (same-origin, curl, server-to-server), proceed
  if (!origin) {
    return next();
  }

  const normalizedOrigin = origin.replace(/\/$/, "");
  const isAllowed = env.corsOrigins.includes(normalizedOrigin);

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    return next();
  }

  // If disallowed Origin makes an OPTIONS preflight, reject with 403
  if (req.method === "OPTIONS") {
    return res.status(403).json({
      error: "CORS_ORIGIN_DENIED",
      message: "Origin not allowed by CORS",
    });
  }

  // Disallowed origin for standard request: proceed without Access-Control-Allow-Origin
  // Browser will block response read
  return next();
}
