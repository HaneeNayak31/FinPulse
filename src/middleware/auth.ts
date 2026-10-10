import { Request, Response, NextFunction } from "express";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    let header = req.headers.authorization ?? "";
    let [scheme, finaltoken] = header?.split(" ") ?? [];
    if (scheme !== "Bearer" || !finaltoken) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }
    if (!jwtSecret) {
      return res.status(500).json({ message: "Server configuration error" });
    }
    let decoded = jwt.verify(finaltoken, jwtSecret) as JwtPayload & {
      id: number;
    };
    res.locals.user = decoded;
    console.log("Token is valid! Payload:", decoded);
    console.log(`Welcome username ${decoded.id} `);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).send("Invalid or expired token");
  }
};
export default authenticate;
