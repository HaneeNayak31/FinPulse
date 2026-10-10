import { Pool } from "pg";

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function testDatabaseConnection() {
  const result = await pool.query("SELECT NOW()");
  console.log("Database connected:", result.rows[0]);
}

export default pool;
