"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = testDatabaseConnection;
const pg_1 = require("pg");
const env_1 = __importDefault(require("./config/env"));
console.log("DB Pool initialized with DB URL:", env_1.default.databaseUrl.replace(/:[^:@]+@/, ":***@"));
const pool = new pg_1.Pool({
    connectionString: env_1.default.databaseUrl,
});
async function testDatabaseConnection() {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0]);
}
exports.default = pool;
