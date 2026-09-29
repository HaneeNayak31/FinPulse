import express, { type Express, type Request, type Response } from "express";
import "dotenv/config";
const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "FinPulse API is running" });
});

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
});
