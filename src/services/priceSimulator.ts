import pool from "../db";
import redis from "../redis";

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
const priceSimulator = async (symbol: string) => {
  symbol = symbol.toUpperCase();
  if (!symbol || !/^[A-Z0-9.-]+$/.test(symbol)) {
    throw new Error("Invalid Asset Symbol");
  }
  let key = `asset:${symbol}`;
  const changePercent = getRandom(-0.01, 0.01);
  let getAsset = await pool.query<{
    id: number;
    current_price: number;
    name: string;
  }>(`SELECT * FROM assets WHERE symbol = $1`, [symbol]);
  if (getAsset.rows.length === 0) {
    throw new Error("No Asset found");
  }
  const currentPrice = Number(getAsset.rows[0].current_price);
  const newPrice = Math.round(currentPrice * (1 + changePercent) * 100) / 100;
  if (!Number.isFinite(newPrice) || newPrice <= 0) {
    throw new Error("Price not valid");
  }
  let updatePrice = await pool.query<{
    id: number;
    symbol: string;
    name: string;
    current_price: string;
  }>(
    `UPDATE assets SET current_price = $1 WHERE symbol = $2 RETURNING id,      symbol, name, current_price`,
    [newPrice, symbol],
  );
  if (updatePrice.rows.length === 0) {
    throw new Error("Asset not found");
  }
  await redis.del(key, "assets:all");

  const updatedAsset = updatePrice.rows[0];

  const event = {
    event: "PRICE_UPDATED",
    symbol: updatedAsset.symbol,
    price: updatedAsset.current_price,
    timestamp: new Date().toISOString(),
  };

  await redis.publish("market:prices", JSON.stringify(event));

  return updatedAsset;
};
export default priceSimulator;
