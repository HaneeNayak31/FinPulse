import "dotenv/config";

process.env.NODE_ENV = "test";
const rawDb = process.env.DATABASE_URL || "";
process.env.TEST_DATABASE_URL = rawDb.replace(
  /\/[^/?]+(\?.*)?$/,
  "/finpulse_test$1",
);
