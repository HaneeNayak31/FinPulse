import { Request, Response } from "express";
import {
  executeOrder,
  getPortfolioOrders,
  OrderServiceError,
} from "../services/orderService";

export async function createOrderHandler(req: Request, res: Response) {
  try {
    const portfolioId: number = Number(req.params.id);
    const quantity: number = req.body.quantity;
    const orderType = req.body.type;
    const assetId: number = req.body.asset_id;

    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
      return res.status(400).json({
        error: "INVALID_PORTFOLIO_ID",
        message: "Invalid portfolio ID",
      });
    }

    if (!Number.isInteger(assetId) || assetId <= 0) {
      return res.status(400).json({
        error: "INVALID_ASSET_ID",
        message: "Invalid asset ID",
      });
    }

    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        error: "INVALID_QUANTITY",
        message: "Quantity must be greater than 0",
      });
    }

    if (orderType !== "BUY" && orderType !== "SELL") {
      return res.status(400).json({
        error: "INVALID_ORDER_TYPE",
        message: "Order type must be BUY or SELL",
      });
    }

    const newOrder = await executeOrder({
      portfolioId,
      userId: res.locals.user.id,
      assetId,
      quantity,
      orderType,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return res.status(error.status).json({
        error: error.errorCode,
        message: error.message,
      });
    }

    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getOrdersHandler(req: Request, res: Response) {
  try {
    const portfolioId = Number(req.params.id);
    const userId = res.locals.user.id;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const offset = (page - 1) * limit;

    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
      return res.status(400).json({
        message: "Invalid portfolio ID",
      });
    }

    const { portfolioExists, orders } = await getPortfolioOrders(
      portfolioId,
      userId,
      limit,
      offset,
    );

    if (!portfolioExists) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      page,
      limit,
      orders,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
