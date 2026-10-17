import pool from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import env from "../config/env";

const SALT_ROUNDS = 10;

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface UserPublic {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateToken(payload: {
  id: number;
  email: string;
}): string {
  if (!env.jwtSecret) {
    throw new Error("JWT secret is not configured");
  }
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "1d" });
}

export async function findUserByEmail(
  email: string,
): Promise<{ id: number; password_hash: string; email: string } | null> {
  const result = await pool.query<{
    id: number;
    password_hash: string;
    email: string;
  }>("SELECT id,password_hash,email FROM users WHERE email = $1", [email]);

  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

export async function checkUserExists(email: string): Promise<boolean> {
  const result = await pool.query<{ user_exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM users WHERE email = $1) AS user_exists",
    [email],
  );
  return result.rows[0]?.user_exists ?? false;
}

export async function createUser(
  username: string,
  email: string,
  hashedPassword: string,
): Promise<UserPublic> {
  const result = await pool.query<UserPublic>(
    `INSERT INTO users(username, email, password_hash)VALUES ($1,$2,$3) RETURNING id,username,email,created_at`,
    [username, email, hashedPassword],
  );
  return result.rows[0];
}
