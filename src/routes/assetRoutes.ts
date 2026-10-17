import { Router } from "express";
import {
  listAssetsHandler,
  getAssetBySymbolHandler,
  simulateTickHandler,
} from "../controllers/assetController";

const router = Router();

router.get("/", listAssetsHandler);
router.get("/:symbol", getAssetBySymbolHandler);
router.post("/:symbol/simulate", simulateTickHandler);

export default router;
