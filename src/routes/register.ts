import express, { Request, Response } from "express";
import pool from "../db";
import bcrypt from "bcrypt";

const saltRounds = 10;

async function hashpassword(password: string): Promise<string> {
  return await bcrypt.hash(password, saltRounds);
}

export async function register(req: Request, res: Response) {
  try {
    const username: string = req.body.username;
    const email: string = req.body.email;
    const password: string = req.body.password;
    if (!email || !username || !password) {
      return res.status(400).send("all fields are required");
    }
    if (password && password.length < 8) {
      return res
        .status(400)
        .send("password length should be equal to or greater than 8");
    }
    const queryText =
      "SELECT EXISTS (SELECT 1 FROM users WHERE email = $1) AS user_exists";
    const userExists = await pool.query<{ user_exists: boolean }>(queryText, [
      email,
    ]);

    if (userExists.rows[0]?.user_exists) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedpassword = await hashpassword(password);

    const addUser = await pool.query(
      `INSERT INTO users(username, email, password_hash)VALUES ($1,$2,$3) RETURNING id,username,email,created_at`,
      [username, email, hashedpassword],
    );
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: addUser.rows[0],
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
}
