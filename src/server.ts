import "dotenv/config";
import express, { Request, Response } from "express";
import { testDatabaseConnection } from "./db";
import { register } from "./routes/register";
import { login } from "./routes/login";
import authenticate from "./middleware/auth";
import pool from "./db";
import redis from "./redis";
import priceSimulator from "./services/priceSimulator";
import portfolioEventsRouter from "./routes/portfolioEvents";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { subscriber } from "./redis";
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 4000;
const clientSubscriptions = new Map<WebSocket, Set<string>>();
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
    try {
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
    } catch (error) {
      console.error("Error", error);
      return res.json({
        success: false,
        message: "Server Error",
      });
    }
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

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        //verify portfolio ownership
        const checkifCorrectUser = await client.query<{ user_id: number }>(
          `SELECT user_id FROM portfolios WHERE id = $1`,
          [portfolioId],
        );
        if (checkifCorrectUser.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({
            success: false,
            message: "Portfolio not found",
          });
        }
        if (checkifCorrectUser.rows[0].user_id !== res.locals.user.id) {
          await client.query("ROLLBACK");
          return res.status(403).json({
            success: false,
            message: "Not authorized",
          });
        }
        //fetching asset price
        const checkifCorrectPrice = await client.query<{
          current_price: string;
        }>(`SELECT current_price FROM assets WHERE id = $1`, [assetId]);

        if (checkifCorrectPrice.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({
            success: false,
            message: "Asset not found",
          });
        }
        const price = Number(checkifCorrectPrice.rows[0].current_price);
        let newOrder;
        //BUY
        if (orderType == "BUY") {
          //INSERT ORDER
          // 1. Insert the order inside the transaction
          const orderResult = await client.query(
            `INSERT INTO orders (portfolio_id, asset_id, type, quantity, price)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, portfolio_id, asset_id,
             type, quantity, price, created_at`,
            [portfolioId, assetId, orderType, quantity, price],
          );

          if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");
            throw new Error("Order was not created");
          }

          newOrder = orderResult.rows[0];
          // 2. Create a holding or update the existing holding
          await client.query(
            `INSERT INTO holdings (portfolio_id, asset_id, quantity, average_price) VALUES ($1, $2, $3, $4) ON CONFLICT (portfolio_id, asset_id) DO UPDATE SET average_price = ( holdings.quantity * holdings.average_price
            + EXCLUDED.quantity * EXCLUDED.average_price) / (holdings.quantity + EXCLUDED.quantity), quantity = holdings.quantity + EXCLUDED.quantity`,
            [portfolioId, assetId, quantity, price],
          );
        }
        if (orderType === "SELL") {
          // 1. Find and lock the holding for this portfolio and asset
          const holdingResult = await client.query<{
            quantity: string;
          }>(
            `SELECT quantity
     FROM holdings
     WHERE portfolio_id = $1 AND asset_id = $2
     FOR UPDATE`,
            [portfolioId, assetId],
          );

          // 2. Reject if the user doesn't own this asset
          if (holdingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
              success: false,
              message: "No holding exists for this asset",
            });
          }

          const availableQuantity = Number(holdingResult.rows[0].quantity);

          // 3. Prevent selling more than the user owns
          if (quantity > availableQuantity) {
            await client.query("ROLLBACK");
            return res.status(400).json({
              success: false,
              message: "Insufficient quantity to sell",
            });
          }

          // 4. Insert the SELL order
          const orderResult = await client.query(
            `INSERT INTO orders (portfolio_id, asset_id, type, quantity, price)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, portfolio_id, asset_id,
             type, quantity, price, created_at`,
            [portfolioId, assetId, orderType, quantity, price],
          );

          if (orderResult.rows.length === 0) {
            throw new Error("Sell order was not created");
          }

          newOrder = orderResult.rows[0];

          // 5. Reduce the holding quantity
          await client.query(
            `UPDATE holdings SET quantity = quantity - $1 WHERE portfolio_id = $2 AND asset_id = $3`,
            [quantity, portfolioId, assetId],
          );
        }

        await client.query("COMMIT");

        return res.status(201).json({
          success: true,
          message: "Order created successfully",
          order: newOrder,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
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

app.get("/assets", async (req: Request, res: Response) => {
  try {
    const key = "assets:all";
    const cachedAsset = await redis.get(key);
    if (cachedAsset) {
      console.log("CACHE HIT:", key);
      return res.status(200).json({
        success: true,
        assets: JSON.parse(cachedAsset),
      });
    }
    console.log("CACHE MISS:", key);
    const query = `SELECT * FROM assets`;
    const assetResult = await pool.query<{
      id: number;
      symbol: string;
      name: string;
      current_price: number;
      created_at: string;
    }>(query);

    if (assetResult.rows.length === 0) {
      return res.status(200).json({
        success: false,
        assets: [],
      });
    }

    const assets = assetResult.rows;
    await redis.set(key, JSON.stringify(assets), "EX", 30);

    return res.status(200).json({
      success: true,
      assets,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.get("/assets/:symbol", async (req: Request, res: Response) => {
  try {
    const symbol = String(req.params.symbol).toUpperCase();
    const key = `asset:${symbol}`;
    if (!symbol || !/^[A-Z0-9.-]+$/.test(symbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset symbol",
      });
    }
    const cachedAsset = await redis.get(key);
    if (cachedAsset) {
      console.log("CACHE HIT:", key);
      return res.status(200).json({
        success: true,
        asset: JSON.parse(cachedAsset),
      });
    }

    console.log("CACHE MISS:", key);
    const query = `SELECT id, symbol, name, current_price FROM assets WHERE symbol = $1`;
    const assetResult = await pool.query<{
      id: number;
      symbol: string;
      name: string;
      current_price: number;
    }>(query, [symbol]);

    if (assetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const asset = assetResult.rows[0];
    await redis.set(key, JSON.stringify(asset), "EX", 30);

    return res.status(200).json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.post("/assets/:symbol/simulate", async (req: Request, res: Response) => {
  try {
    const symbol = String(req.params.symbol);
    const asset = await priceSimulator(symbol);
    return res.status(200).json({
      success: true,
      message: "Price updated successfully",
      asset,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid Asset Symbol") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message === "No Asset found" ||
        error.message === "Asset not found"
      ) {
        return res.status(404).json({
          success: false,
          message: "Asset not found",
        });
      }
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.use("/portfolios", portfolioEventsRouter);

wss.on("connection", function (ws) {
  console.log("WebSocket client connected");
  clientSubscriptions.set(ws, new Set<string>());
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (
        (message.type === "SUBSCRIBE" || message.type === "UNSUBSCRIBE") &&
        typeof message.symbol === "string"
      ) {
        const symbol = message.symbol.trim().toUpperCase();

        if (!symbol) return;

        const subscriptions = clientSubscriptions.get(ws);

        if (message.type === "SUBSCRIBE") {
          subscriptions?.add(symbol);
          console.log(`Client subscribed to ${symbol}`);
        } else {
          subscriptions?.delete(symbol);
          console.log(`Client unsubscribed from ${symbol}`);
        }
      }
    } catch (error) {
      clientSubscriptions.delete(ws);
      console.error("Invalid WebSocket message");
    }
  });
  ws.on("error", console.error);

  ws.on("close", function () {
    console.log("WebSocket client disconnected");
  });
});
subscriber.on("message", (channel, message) => {
  if (channel !== "market:prices") return;

  try {
    const event = JSON.parse(message);
    const symbol = event.symbol?.toUpperCase();

    if (!symbol) return;

    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        clientSubscriptions.get(client)?.has(symbol)
      ) {
        client.send(message);
      }
    });
  } catch (error) {
    console.error("Invalid price event received from Redis");
  }
});
server.listen(PORT, async () => {
  console.log(`FinPulse server running on port ${PORT}`);

  await testDatabaseConnection();
});
