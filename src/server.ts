import "dotenv/config";
import express, { Request, response, Response } from "express";
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
      portfolio: portfolioslist.rows,
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

app.get(
  "/portfolios/:id",
  authenticate,
  async (req: Request, res: Response) => {
    let userID = res.locals.user.id;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid portfolio ID",
      });
    }
    let query = `SELECT id,name,created_at from portfolios WHERE id = $1 AND user_id = $2`;
    let portfolio = await pool.query<{
      id: number;
      name: string;
      created_at: string;
    }>(query, [id, userID]);
    if (portfolio.rows.length === 0) {
      return res.status(404).json({
        message: "no portfolio found",
      });
    }
    return res.status(200).json({ portfolios: portfolio.rows[0] });
  },
);

app.post(
  "/portfolios/:id/orders",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const portfolioId: number = Number(req.params.id);
      const quantity: number = req.body.quantity;
      const orderType = req.body.type;
      const assetId: number = req.body.asset_id;

      if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
        return res.status(400).json({
          message: "Invalid portfolio ID",
        });
      }

      if (!Number.isInteger(assetId) || assetId <= 0) {
        return res.status(400).json({
          message: "Invalid asset ID",
        });
      }

      if (
        typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          message: "Quantity must be greater than 0",
        });
      }

      if (orderType !== "BUY" && orderType !== "SELL") {
        return res.status(400).json({
          message: "Order type must be BUY or SELL",
        });
      }

      const checkifCorrectUser = await pool.query<{ user_id: number }>(
        `SELECT user_id from portfolios WHERE id = $1`,
        [portfolioId],
      );
      if (checkifCorrectUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found",
        });
      }
      if (checkifCorrectUser.rows[0].user_id !== res.locals.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }
      const checkifCorrectPrice = await pool.query<{ current_price: string }>(
        `SELECT current_price FROM assets WHERE id = $1`,
        [assetId],
      );

      if (checkifCorrectPrice.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Asset not found",
        });
      }

      const price = Number(checkifCorrectPrice.rows[0].current_price);

      const query = `INSERT INTO orders(portfolio_id,asset_id,type,quantity,price) VALUES($1,$2,$3,$4,$5) RETURNING id, portfolio_id, asset_id, type, quantity, price, created_at`;

      const newOrder = await pool.query<{}>(query, [
        portfolioId,
        assetId,
        orderType,
        quantity,
        price,
      ]);

      if (newOrder.rows.length === 0) {
        return res.status(404).json({
          message: "no order found",
        });
      }

      return res.status(201).json({
        success: true,
        message: "order created successfully",
        order: newOrder.rows[0],
      });
    } catch (error) {
      console.error("Error", error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  },
);

app.get(
  "/portfolios/:id/orders",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const portfolioId = Number(req.params.id);
      const userId = res.locals.user.id;
      if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
        return res.status(400).json({
          message: "Invalid portfolio ID",
        });
      }
      const portfolioCheck = await pool.query(
        `SELECT id FROM portfolios
   WHERE id = $1 AND user_id = $2`,
        [portfolioId, userId],
      );

      if (portfolioCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found",
        });
      }

      const getOrders = await pool.query(
        `SELECT o.id, o.portfolio_id, o.asset_id,
          o.type, o.quantity, o.price, o.created_at
   FROM orders AS o
   INNER JOIN portfolios AS p
     ON p.id = o.portfolio_id
   WHERE p.id = $1 AND p.user_id = $2
   ORDER BY o.created_at DESC, o.id DESC`,
        [portfolioId, userId],
      );
      if (getOrders.rows.length === 0) {
        return res.status(200).json({
          success: true,
          orders: [],
        });
      }
      return res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        orders: getOrders.rows,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  },
);

app.get(
  "/portfolios/:id/holdings",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const portfolioId = Number(req.params.id);
      const userId = res.locals.user.id;
      if (
        typeof portfolioId !== "number" ||
        !Number.isFinite(portfolioId) ||
        portfolioId <= 0
      ) {
        return res.status(400).json({
          message: "Portfolio Id must be greater than 0",
        });
      }
      const portfolioExists = await pool.query<{
        id: number;
      }>(`SELECT id FROM portfolios WHERE id = $1 AND user_id = $2`, [
        portfolioId,
        userId,
      ]);
      if (portfolioExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No Portfolio found",
        });
      }
      const holdingsResult = await pool.query<{}>(
        `SELECT
    h.id,
    h.portfolio_id,
    h.asset_id,
    a.symbol,
    a.name,
    h.quantity,
    h.average_price,
    a.current_price
FROM holdings AS h
JOIN assets AS a ON a.id = h.asset_id
WHERE h.portfolio_id = $1
ORDER BY a.symbol`,
        [portfolioId],
      );
      return res.status(200).json({
        success: true,
        holdings: holdingsResult.rows,
      });
    } catch (error) {
      console.error("Error", error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  },
);
app.listen(PORT, async () => {
  console.log(`FinPulse server running on port ${PORT}`);

  await testDatabaseConnection();
});
