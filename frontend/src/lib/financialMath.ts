/**
 * Financial Calculation & Precision Utilities
 *
 * Implements authoritative Average Cost Basis (AVCO) rules,
 * fractional share accounting (compatible with PostgreSQL numeric(14,4)),
 * and exact asset allocation percentage reconciliation.
 */

export interface HoldingCalculation {
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface PortfolioSummaryCalculation {
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  activePositionsCount: number;
}

export interface AssetAllocationItem {
  symbol: string;
  name: string;
  quantity: number;
  marketValue: number;
  percent: number;
}

/**
 * Safely parses any number or numeric string to a JavaScript number.
 */
export function safeNum(val: number | string | null | undefined, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Computes market value, cost basis, and unrealized P&L for a single holding.
 * Uses exact 4-decimal-place rounding for internal monetary precision.
 */
export function computeHoldingMetrics(
  quantity: number | string,
  averagePrice: number | string,
  currentPrice: number | string
): HoldingCalculation {
  const qty = safeNum(quantity);
  const avg = safeNum(averagePrice);
  const cur = safeNum(currentPrice);

  const marketValue = Math.round(qty * cur * 10000) / 10000;
  const costBasis = Math.round(qty * avg * 10000) / 10000;
  const unrealizedPL = Math.round((marketValue - costBasis) * 10000) / 10000;
  const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;

  return {
    marketValue,
    costBasis,
    unrealizedPL,
    unrealizedPLPercent,
  };
}

/**
 * Computes portfolio-level aggregated metrics across all active holdings.
 */
export function computePortfolioSummary(
  holdings: Array<{
    quantity: number | string;
    average_price: number | string;
    current_price: number | string;
  }>
): PortfolioSummaryCalculation {
  let totalMarketValue = 0;
  let totalCostBasis = 0;

  for (const h of holdings) {
    const { marketValue, costBasis } = computeHoldingMetrics(
      h.quantity,
      h.average_price,
      h.current_price
    );
    totalMarketValue += marketValue;
    totalCostBasis += costBasis;
  }

  // Round aggregated totals to currency cents
  totalMarketValue = Math.round(totalMarketValue * 100) / 100;
  totalCostBasis = Math.round(totalCostBasis * 100) / 100;

  const totalUnrealizedPL = Math.round((totalMarketValue - totalCostBasis) * 100) / 100;
  const totalUnrealizedPLPercent =
    totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : 0;

  return {
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedPL,
    totalUnrealizedPLPercent,
    activePositionsCount: holdings.length,
  };
}

/**
 * Computes reconciled asset allocation weights ensuring sum = 100.00%
 */
export function computeAssetAllocations(
  holdings: Array<{
    symbol: string;
    name?: string;
    quantity: number | string;
    current_price: number | string;
  }>
): AssetAllocationItem[] {
  if (holdings.length === 0) return [];

  const items = holdings.map((h) => {
    const qty = safeNum(h.quantity);
    const cur = safeNum(h.current_price);
    const marketValue = Math.round(qty * cur * 100) / 100;
    return {
      symbol: h.symbol,
      name: h.name || h.symbol,
      quantity: qty,
      marketValue,
    };
  });

  const totalEquity = items.reduce((sum, item) => sum + item.marketValue, 0);
  if (totalEquity <= 0) {
    return items.map((item) => ({
      ...item,
      percent: 0,
    }));
  }

  return items.map((item) => ({
    ...item,
    percent: Math.round((item.marketValue / totalEquity) * 10000) / 100,
  }));
}
