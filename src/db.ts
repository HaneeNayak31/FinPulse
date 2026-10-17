import { Pool } from "pg";
import env from "./config/env";

console.log("DB Pool initialized with DB URL:", env.databaseUrl.replace(/:[^:@]+@/, ":***@"));

const pool = new Pool({
  connectionString: env.databaseUrl,
});

export async function testDatabaseConnection() {
  const result = await pool.query("SELECT NOW()");
  console.log("Database connected:", result.rows[0]);
}

export default pool;
