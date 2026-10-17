import pool from "../db";
import redis from "../redis";

export interface AssetRow {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
  created_at?: string;
}

const CACHE_TTL = 30; // seconds

export async function getAllAssets(): Promise<{
  assets: AssetRow[];
  fromCache: boolean;
}> {
  const key = "assets:all";
  const cachedAsset = await redis.get(key);
  if (cachedAsset) {
    console.log("CACHE HIT:", key);
    return { assets: JSON.parse(cachedAsset), fromCache: true };
  }

  console.log("CACHE MISS:", key);
  const query = `SELECT * FROM assets`;
  const assetResult = await pool.query<AssetRow>(query);
  const assets = assetResult.rows;

  if (assets.length > 0) {
    await redis.set(key, JSON.stringify(assets), "EX", CACHE_TTL);
  }

  return { assets, fromCache: false };
}

export async function getAssetBySymbol(
  symbol: string,
): Promise<{ asset: AssetRow | null; fromCache: boolean }> {
  const key = `asset:${symbol}`;
  const cachedAsset = await redis.get(key);
  if (cachedAsset) {
    console.log("CACHE HIT:", key);
    return { asset: JSON.parse(cachedAsset), fromCache: true };
  }

  console.log("CACHE MISS:", key);
  const query = `SELECT id, symbol, name, current_price FROM assets WHERE symbol = $1`;
  const assetResult = await pool.query<AssetRow>(query, [symbol]);

  if (assetResult.rows.length === 0) {
    return { asset: null, fromCache: false };
  }

  const asset = assetResult.rows[0];
  await redis.set(key, JSON.stringify(asset), "EX", CACHE_TTL);

  return { asset, fromCache: false };
}
