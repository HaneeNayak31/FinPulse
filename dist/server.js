"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.json({
        message: "FinPulse API is running",
    });
});
app.listen(PORT, async () => {
    console.log(`FinPulse server running on port ${PORT}`);
    await (0, db_1.testDatabaseConnection)();
});
