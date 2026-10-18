import pool from "../db";

export interface OrderRow {
  id: number;
  portfolio_id: number;
  asset_id: number;
  type: "BUY" | "SELL";
  quantity: string | number;
  price: string | number;
  created_at: Date | string;
}

export class OrderServiceError extends Error {
  status: number;
  errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, OrderServiceError.prototype);
  }
}

export interface CreateOrderParams {
  portfolioId: number;
  userId: number;
  assetId: number;
  quantity: number;
  orderType: "BUY" | "SELL";
}

export async function executeOrder(params: CreateOrderParams): Promise<OrderRow> {
  const { portfolioId, userId, assetId, quantity, orderType } = params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Verify portfolio ownership
    const checkifCorrectUser = await client.query<{ user_id: number }>(
      `SELECT user_id FROM portfolios WHERE id = $1`,
      [portfolioId],
    );

    if (checkifCorrectUser.rows.length === 0) {
      throw new OrderServiceError(404, "PORTFOLIO_NOT_FOUND", "Portfolio not found");
    }

    if (checkifCorrectUser.rows[0].user_id !== userId) {
      throw new OrderServiceError(403, "FORBIDDEN", "Not authorized");
    }

    // 2. Fetching asset price
    const checkifCorrectPrice = await client.query<{
      current_price: string;
    }>(`SELECT current_price FROM assets WHERE id = $1`, [assetId]);

    if (checkifCorrectPrice.rows.length === 0) {
      throw new OrderServiceError(404, "ASSET_NOT_FOUND", "Asset not found");
    }

    const price = Number(checkifCorrectPrice.rows[0].current_price);
    let newOrder: OrderRow;

    if (orderType === "BUY") {
      // Insert order inside the transaction
      const orderResult = await client.query<OrderRow>(
        `INSERT INTO orders (portfolio_id, asset_id, type, quantity, price)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, portfolio_id, asset_id,
         type, quantity, price, created_at`,
        [portfolioId, assetId, orderType, quantity, price],
      );

      if (orderResult.rows.length === 0) {
        throw new Error("Order was not created");
      }

      newOrder = orderResult.rows[0];

      // Create a holding or update the existing holding
      await client.query(
        `INSERT INTO holdings (portfolio_id, asset_id, quantity, average_price) VALUES ($1, $2, $3, $4) ON CONFLICT (portfolio_id, asset_id) DO UPDATE SET average_price = ( holdings.quantity * holdings.average_price
        + EXCLUDED.quantity * EXCLUDED.average_price) / (holdings.quantity + EXCLUDED.quantity), quantity = holdings.quantity + EXCLUDED.quantity`,
        [portfolioId, assetId, quantity, price],
      );
    } else {
      // Find and lock the holding for this portfolio and asset
      const holdingResult = await client.query<{
        quantity: string;
      }>(
        `SELECT quantity
 FROM holdings
 WHERE portfolio_id = $1 AND asset_id = $2
 FOR UPDATE`,
        [portfolioId, assetId],
      );

      if (holdingResult.rows.length === 0) {
        throw new OrderServiceError(
          400,
          "HOLDING_NOT_FOUND",
          "No holding exists for this asset.",
        );
      }

      const availableQuantity = Number(holdingResult.rows[0].quantity);

      if (quantity > availableQuantity) {
        throw new OrderServiceError(
          400,
          "INSUFFICIENT_HOLDINGS",
          "Cannot sell more shares than owned.",
        );
      }

      const orderResult = await client.query<OrderRow>(
        `INSERT INTO orders (portfolio_id, asset_id, type, quantity, price)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, portfolio_id, asset_id,
         type, quantity, price, created_at`,
        [portfolioId, assetId, orderType, quantity, price],
      );

      if (orderResult.rows.length === 0) {
        throw new Error("Sell order was not created");
      }

      newOrder = orderResult.rows[0];

      // Reduce the holding quantity
      await client.query(
        `UPDATE holdings SET quantity = quantity - $1 WHERE portfolio_id = $2 AND asset_id = $3`,
        [quantity, portfolioId, assetId],
      );
    }

    await client.query("COMMIT");
    return newOrder;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPortfolioOrders(
  portfolioId: number,
  userId: number,
  limit: number,
  offset: number,
): Promise<{ portfolioExists: boolean; orders: OrderRow[] }> {
  const portfolioCheck = await pool.query(
    `SELECT id FROM portfolios
 WHERE id = $1 AND user_id = $2`,
    [portfolioId, userId],
  );

  if (portfolioCheck.rows.length === 0) {
    return { portfolioExists: false, orders: [] };
  }

  const getOrders = await pool.query<OrderRow>(
    `SELECT o.id, o.portfolio_id, o.asset_id, o.type, o.quantity, o.price, o.created_at FROM orders AS o INNER JOIN portfolios AS p ON p.id = o.portfolio_id WHERE p.id = $1 AND p.user_id = $2 ORDER BY o.created_at DESC, o.id DESC LIMIT $3 OFFSET $4`,
    [portfolioId, userId, limit, offset],
  );

  return { portfolioExists: true, orders: getOrders.rows };
}
