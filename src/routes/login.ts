import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db";
import bcrypt from "bcrypt";
import "dotenv/config";

export async function login(req: Request, res: Response) {
  let email: string = req.body.email;
  let password: string = req.body.password;

  if (!email || !password) {
    return res.status(400).send("all the fields are required");
  }

  if (password && password.length < 8) {
    return res
      .status(400)
      .send("password length should be equal to or greater than 8");
  }
  const pquery = "SELECT id,password_hash,email FROM users WHERE email = $1";
  const hashedpwd = await pool.query<{
    id: number;
    password_hash: string;
    email: string;
  }>(pquery, [email]);
  if (hashedpwd.rows.length === 0) {
    return res.status(401).json({
      success: false,
      message: "no user found",
    });
  }
  const passwordMatches = await bcrypt.compare(
    password,
    hashedpwd.rows[0]?.password_hash,
  );
  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({
      success: false,
      message: "JWT secret is not configured",
    });
  }

  const token = jwt.sign(
    { id: hashedpwd.rows[0]?.id, email: hashedpwd.rows[0]?.email },
    jwtSecret,
    {
      expiresIn: "1d",
    },
  );
  res.status(200).send({
    success: true,
    message: "user loggedin successfully",
    token: token,
  });
}
