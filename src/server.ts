import "dotenv/config";
import express, { Request, Response } from "express";
import { testDatabaseConnection } from "./db";
import { register } from "./routes/register";
import { login } from "./routes/login";
import authenticate from "./middleware/auth";
import pool from "./db";
const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "FinPulse API is running",
  });
});

app.post("/auth/register", register);
app.post("/auth/login", login);
app.get("/auth/me", authenticate, (req: Request, res: Response) => {
  res.json({
    user: res.locals.user,
  });
});
app.get("/portfolios", authenticate, async (req: Request, res: Response) => {
  try {
    const id = res.locals.user.id;
    let query = `SELECT id, name, created_at from portfolios WHERE user_id = $1`;
    let portfolioslist = await pool.query<{
      id: number;
      name: string;
      created_at: Date;
    }>(query, [id]);
    if (portfolioslist.rows.length === 0) {
      return res.status(200).json({
        portfolios: [],
      });
    }
    return res.status(200).json({
      portfolios: portfolioslist.rows,
    });
  } catch (error) {
    console.error("error", error);
    return res.status(500).json({
      success: false,
      message: "not able to get portfolio",
    });
  }
});
app.post("/portfolios", authenticate, async (req: Request, res: Response) => {
  try {
    const id = res.locals.user.id;
    let name: string = req.body.name;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "all fields are required",
      });
    }
    const query = await pool.query<{
      id: number;
      name: string;
      user_id: number;
      created_at: Date;
    }>(
      `INSERT INTO portfolios(user_id, name)
   VALUES ($1, $2)
   RETURNING id, name, user_id, created_at`,
      [id, name.trim()],
    );
    return res.status(201).json({
      success: true,
      message: "Portfolio created successfully",
      portfolio: query.rows[0],
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Portfolio addition failed",
    });
  }
});
app.listen(PORT, async () => {
  console.log(`FinPulse server running on port ${PORT}`);

  await testDatabaseConnection();
});
