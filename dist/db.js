"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = testDatabaseConnection;
const pg_1 = require("pg");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
async function testDatabaseConnection() {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0]);
}
exports.default = pool;
