import { Request, Response } from "express";
import {
  findUserByEmail,
  comparePassword,
  generateToken,
  checkUserExists,
  hashPassword,
  createUser,
} from "../services/authService";

export async function loginHandler(req: Request, res: Response) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).send("all the fields are required");
  }

  if (password && password.length < 8) {
    return res
      .status(400)
      .send("password length should be equal to or greater than 8");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "no user found",
    });
  }

  const passwordMatches = await comparePassword(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  try {
    const token = generateToken({ id: user.id, email: user.email });
    res.status(200).send({
      success: true,
      message: "user loggedin successfully",
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "JWT secret is not configured",
    });
  }
}

export async function registerHandler(req: Request, res: Response) {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !username || !password) {
      return res.status(400).send("all fields are required");
    }
    if (password && password.length < 8) {
      return res
        .status(400)
        .send("password length should be equal to or greater than 8");
    }

    const exists = await checkUserExists(email);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedpassword = await hashPassword(password);
    const newUser = await createUser(username, email, hashedpassword);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
}

export function meHandler(req: Request, res: Response) {
  res.json({
    user: res.locals.user,
  });
}
