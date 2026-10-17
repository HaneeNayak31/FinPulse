import pool from "../db";

export interface PortfolioRow {
  id: number;
  name: string;
  user_id?: number;
  created_at: Date | string;
}

export interface HoldingRow {
  id: number;
  portfolio_id: number;
  asset_id: number;
  symbol: string;
  name: string;
  quantity: string | number;
  average_price: string | number;
  current_price: string | number;
}

export async function getUserPortfolios(userId: number): Promise<PortfolioRow[]> {
  const query = `SELECT id, name, created_at from portfolios WHERE user_id = $1`;
  const result = await pool.query<PortfolioRow>(query, [userId]);
  return result.rows;
}

export async function createPortfolio(
  userId: number,
  name: string,
): Promise<PortfolioRow> {
  const query = `INSERT INTO portfolios(user_id, name)
   VALUES ($1, $2)
   RETURNING id, name, user_id, created_at`;
  const result = await pool.query<PortfolioRow>(query, [userId, name]);
  return result.rows[0];
}

export async function getPortfolioByIdAndUser(
  portfolioId: number,
  userId: number,
): Promise<PortfolioRow | null> {
  const query = `SELECT id, name, created_at from portfolios WHERE id = $1 AND user_id = $2`;
  const result = await pool.query<PortfolioRow>(query, [portfolioId, userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function checkPortfolioOwnership(
  portfolioId: number,
  userId: number,
): Promise<boolean> {
  const query = `SELECT id FROM portfolios WHERE id = $1 AND user_id = $2`;
  const result = await pool.query<{ id: number }>(query, [portfolioId, userId]);
  return result.rows.length > 0;
}

export async function getPortfolioHoldings(
  portfolioId: number,
): Promise<HoldingRow[]> {
  const query = `SELECT
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
ORDER BY a.symbol`;
  const result = await pool.query<HoldingRow>(query, [portfolioId]);
  return result.rows;
}
