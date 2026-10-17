import { Request, Response } from "express";
import { getAllAssets, getAssetBySymbol } from "../services/assetService";
import priceSimulator from "../services/priceSimulator";

export async function listAssetsHandler(req: Request, res: Response) {
  try {
    const { assets } = await getAllAssets();

    if (assets.length === 0) {
      return res.status(200).json({
        success: false,
        assets: [],
      });
    }

    return res.status(200).json({
      success: true,
      assets,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getAssetBySymbolHandler(req: Request, res: Response) {
  try {
    const symbol = String(req.params.symbol).toUpperCase();
    if (!symbol || !/^[A-Z0-9.-]+$/.test(symbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset symbol",
      });
    }

    const { asset } = await getAssetBySymbol(symbol);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    return res.status(200).json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function simulateTickHandler(req: Request, res: Response) {
  try {
    const symbol = String(req.params.symbol);
    const asset = await priceSimulator(symbol);
    return res.status(200).json({
      success: true,
      message: "Price updated successfully",
      asset,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid Asset Symbol") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message === "No Asset found" ||
        error.message === "Asset not found"
      ) {
        return res.status(404).json({
          success: false,
          message: "Asset not found",
        });
      }
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
