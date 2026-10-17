import { Pool } from "pg";
import fs from "fs";
import path from "path";
import env from "../src/config/env";

export const TEST_DB_URL = env.databaseUrl.replace(
  /\/[^/?]+(\?.*)?$/,
  "/finpulse_test$1",
);

export const testPool = new Pool({
  connectionString: TEST_DB_URL,
});

export async function initTestDb() {
  const check = await testPool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'",
  );
  if (check.rows.length === 0) {
    const schemaPath = path.resolve(__dirname, "../finpulse_schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");

    // Strip single-line comments and psql slash commands
    const cleanSql = sql
      .replace(/^\\.*$/gm, "")
      .replace(/--.*$/gm, "");

    const statements = cleanSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const s of statements) {
      try {
        await testPool.query(s);
      } catch (err: any) {
        // Ignored
      }
    }
  }

  // Seed standard test assets
  await testPool.query(`
    INSERT INTO public.assets (symbol, name, current_price)
    VALUES
      ('AAPL', 'Apple Inc.', 150.00),
      ('MSFT', 'Microsoft Corporation', 300.00),
      ('GOOGL', 'Alphabet Inc.', 140.00),
      ('TSLA', 'Tesla Inc.', 200.00)
    ON CONFLICT (symbol) DO NOTHING;
  `);
}

export async function cleanTestDb() {
  await testPool.query(`
    TRUNCATE TABLE public.orders, public.holdings, public.portfolios, public.users RESTART IDENTITY CASCADE;
    UPDATE public.assets SET current_price = 150.00 WHERE symbol = 'AAPL';
    UPDATE public.assets SET current_price = 300.00 WHERE symbol = 'MSFT';
    UPDATE public.assets SET current_price = 140.00 WHERE symbol = 'GOOGL';
    UPDATE public.assets SET current_price = 200.00 WHERE symbol = 'TSLA';
  `);
}

if (require.main === module) {
  initTestDb()
    .then(async () => {
      const res = await testPool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      );
      console.log(
        "finpulse_test ready with tables:",
        res.rows.map((r) => r.table_name),
      );
      await testPool.end();
    })
    .catch((err) => {
      console.error("Test DB initialization failed:", err);
      process.exit(1);
    });
}
