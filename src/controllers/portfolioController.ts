import { Request, Response } from "express";
import {
  getUserPortfolios,
  createPortfolio,
  getPortfolioByIdAndUser,
  checkPortfolioOwnership,
  getPortfolioHoldings,
} from "../services/portfolioService";

export async function listPortfoliosHandler(req: Request, res: Response) {
  try {
    const id = res.locals.user.id;
    const portfolioslist = await getUserPortfolios(id);

    return res.status(200).json({
      success: true,
      portfolios: portfolioslist,
      portfolio: portfolioslist,
    });
  } catch (error) {
    console.error("error", error);
    return res.status(500).json({
      success: false,
      message: "not able to get portfolio",
    });
  }
}

export async function createPortfolioHandler(req: Request, res: Response) {
  try {
    const id = res.locals.user.id;
    const name: string = req.body.name;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "all fields are required",
      });
    }

    const portfolio = await createPortfolio(id, name.trim());

    return res.status(201).json({
      success: true,
      message: "Portfolio created successfully",
      portfolio,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Portfolio addition failed",
    });
  }
}

export async function getPortfolioHandler(req: Request, res: Response) {
  try {
    const userID = res.locals.user.id;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid portfolio ID",
      });
    }

    const portfolio = await getPortfolioByIdAndUser(id, userID);

    if (!portfolio) {
      return res.status(404).json({
        message: "no portfolio found",
      });
    }

    return res.status(200).json({
      success: true,
      portfolio,
      portfolios: portfolio,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getHoldingsHandler(req: Request, res: Response) {
  try {
    const portfolioId = Number(req.params.id);
    const userId = res.locals.user.id;

    if (
      typeof portfolioId !== "number" ||
      !Number.isFinite(portfolioId) ||
      portfolioId <= 0
    ) {
      return res.status(400).json({
        message: "Portfolio Id must be greater than 0",
      });
    }

    const portfolioExists = await checkPortfolioOwnership(portfolioId, userId);

    if (!portfolioExists) {
      return res.status(404).json({
        success: false,
        message: "No Portfolio found",
      });
    }

    const holdings = await getPortfolioHoldings(portfolioId);

    return res.status(200).json({
      success: true,
      holdings,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
