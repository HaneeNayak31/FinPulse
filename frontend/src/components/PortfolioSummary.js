import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCurrency, formatPercent } from '../lib/utils';
import { PortfolioMetricCard } from './PortfolioMetricCard';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Layers } from 'lucide-react';
import { computePortfolioSummary } from '../lib/financialMath';
export const PortfolioSummary = ({ holdings, isLoading }) => {
    if (isLoading) {
        return (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [1, 2, 3, 4].map((i) => (_jsx(PortfolioMetricCard, { label: "LOADING", value: "\u2014", subtitle: "", icon: Wallet, isLoading: true }, i))) }));
    }
    // Authoritative calculations from financialMath utility
    const { totalMarketValue, totalCostBasis, totalUnrealizedPL, totalUnrealizedPLPercent, activePositionsCount, } = computePortfolioSummary(holdings);
    const isProfit = totalUnrealizedPL > 0;
    const isLoss = totalUnrealizedPL < 0;
    const plBadgeVariant = isProfit ? 'positive' : isLoss ? 'negative' : 'neutral';
    const plBadgeText = totalCostBasis > 0 ? formatPercent(totalUnrealizedPLPercent) : '0.00%';
    return (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(PortfolioMetricCard, { label: "Portfolio Market Value", value: formatCurrency(totalMarketValue), subtitle: holdings.length === 0 ? 'No active equity holdings' : `${holdings.length} ${holdings.length === 1 ? 'position' : 'positions'} across active book`, icon: Wallet }), _jsx(PortfolioMetricCard, { label: "Net Unrealized P&L", value: _jsx("span", { className: isProfit ? 'text-sage-text' : isLoss ? 'text-coral-text' : 'text-text-primary', children: isProfit ? `+${formatCurrency(totalUnrealizedPL)}` : formatCurrency(totalUnrealizedPL) }), subtitle: isProfit ? 'Gain from initial fill' : isLoss ? 'Drawdown from cost' : 'At cost parity', icon: isLoss ? TrendingDown : TrendingUp, badge: {
                    text: plBadgeText,
                    variant: plBadgeVariant,
                } }), _jsx(PortfolioMetricCard, { label: "Total Cost Basis", value: formatCurrency(totalCostBasis), subtitle: "Total purchase consideration deployed", icon: DollarSign }), _jsx(PortfolioMetricCard, { label: "Active Instruments", value: holdings.length, subtitle: holdings.length === 0 ? 'No equity positions open' : holdings.length === 1 ? '1 equity instrument' : `${holdings.length} equity instruments`, icon: Layers })] }));
};
