import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCurrency, formatPercent } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon, Layers } from 'lucide-react';
import { computeAssetAllocations } from '../lib/financialMath';
export const PortfolioAllocation = ({ holdings, isLoading, onOpenOrderDialog, className, }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    if (isLoading) {
        return (_jsxs("div", { className: `p-5 rounded-lg bg-surface border border-border flex flex-col justify-between h-full ${className || ''}`, children: [_jsx("div", { className: "h-5 w-40 bg-surface-elevated rounded animate-pulse mb-4" }), _jsx("div", { className: "h-44 w-full bg-surface-elevated/40 rounded animate-pulse my-auto" })] }));
    }
    // Calculate allocations strictly from real holdings using financialMath
    const totalMarketValue = holdings.reduce((acc, h) => acc + h.market_value, 0);
    const allocationItems = computeAssetAllocations(holdings);
    const allocationData = allocationItems.map((item) => {
        const rawHolding = holdings.find((h) => h.symbol === item.symbol);
        return {
            name: item.symbol,
            fullName: item.name,
            shares: item.quantity,
            value: item.marketValue,
            percent: item.percent,
        };
    });
    // Theme-aware restrained palette
    const ALLOCATION_COLORS = isDark
        ? ['#E5B15C', '#83AA8B', '#A09E94', '#D9857B', '#7A99AA', '#BFA478']
        : ['#98651C', '#34734A', '#5C5E55', '#B63F37', '#4E6A78', '#8A6E46'];
    const chartStroke = isDark ? '#191A17' : '#FFFEFA';
    const tooltipBg = isDark ? '#20211D' : '#FFFFFF';
    const tooltipBorder = isDark ? '#2D2E28' : '#E4DED2';
    const tooltipText = isDark ? '#E9E6DE' : '#252820';
    return (_jsxs("div", { className: `p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between h-full ${className || ''}`, children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between pb-3 mb-4 border-b border-border-subtle", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(PieIcon, { className: "w-4 h-4 text-amber" }), _jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-text-primary tracking-wide", children: "Asset Allocation" }), _jsx("p", { className: "text-[11px] text-text-muted mt-0.5", children: "Relative portfolio weight of owned positions" })] })] }), _jsxs("span", { className: "text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-border-subtle bg-surface-elevated text-text-secondary", children: [holdings.length, " ", holdings.length === 1 ? 'Position' : 'Positions'] })] }), holdings.length === 0 ? (_jsxs("div", { className: "py-10 px-4 text-center my-auto", children: [_jsx("div", { className: "w-10 h-10 rounded-full border border-border bg-surface-elevated flex items-center justify-center mx-auto text-text-muted mb-3", children: _jsx(Layers, { className: "w-5 h-5" }) }), _jsx("p", { className: "text-xs font-semibold text-text-primary mb-1", children: "No Capital Allocated" }), _jsx("p", { className: "text-[11px] text-text-muted max-w-xs mx-auto mb-4 leading-relaxed", children: "Holdings allocation weights will calculate automatically once you execute paper purchase orders." }), onOpenOrderDialog && (_jsx("button", { onClick: onOpenOrderDialog, className: "px-3.5 py-1.5 text-xs font-mono font-medium text-black bg-amber hover:bg-amber-hover rounded transition-colors", children: "Execute Initial Order" }))] })) : (_jsxs("div", { children: [_jsxs("div", { className: "h-36 sm:h-40 w-full relative my-1", children: [_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: allocationData, innerRadius: 46, outerRadius: 62, paddingAngle: allocationData.length > 1 ? 3 : 0, dataKey: "value", children: allocationData.map((_, index) => (_jsx(Cell, { fill: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length], stroke: chartStroke, strokeWidth: 2 }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (val) => formatCurrency(Number(val)), contentStyle: {
                                                        backgroundColor: tooltipBg,
                                                        borderColor: tooltipBorder,
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontFamily: 'JetBrains Mono, monospace',
                                                        color: tooltipText,
                                                        boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.08)',
                                                    } })] }) }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center pointer-events-none", children: [_jsx("span", { className: "text-[9px] font-mono uppercase tracking-widest text-text-muted", children: "Total Equity" }), _jsx("span", { className: "text-xs sm:text-sm font-mono font-bold text-text-primary tabular-nums", children: formatCurrency(totalMarketValue) })] })] }), _jsx("div", { className: "space-y-2 mt-2 font-mono text-xs", children: allocationData.map((item, idx) => {
                                    const color = ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length];
                                    return (_jsxs("div", { className: "py-1.5 px-2 rounded hover:bg-surface-elevated/40 transition-colors border-b border-border-subtle/30 last:border-b-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("span", { className: "w-2 h-2 rounded-full flex-shrink-0", style: { backgroundColor: color } }), _jsx("span", { className: "font-bold text-text-primary text-xs tracking-wide", children: item.name }), _jsxs("span", { className: "text-[11px] text-text-muted font-sans truncate max-w-[100px] sm:max-w-[130px]", children: [item.fullName, " \u00B7 ", item.shares, " shs"] })] }), _jsxs("div", { className: "flex items-center gap-2.5 tabular-nums", children: [_jsx("span", { className: "text-text-secondary text-[11px]", children: formatCurrency(item.value) }), _jsx("span", { className: "text-text-primary font-semibold text-xs w-12 text-right", children: formatPercent(item.percent) })] })] }), _jsx("div", { className: "w-full h-1 bg-border-subtle/70 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-300", style: {
                                                        width: `${Math.max(2, item.percent)}%`,
                                                        backgroundColor: color,
                                                    } }) })] }, item.name));
                                }) })] }))] }), _jsxs("div", { className: "pt-3 mt-4 border-t border-border-subtle text-[11px] font-mono text-text-muted flex items-center justify-between", children: [_jsx("span", { children: "Holdings Reconciled" }), _jsx("span", { className: "text-text-primary font-medium", children: totalMarketValue > 0 ? '100.00% Net Weight' : 'Unfunded' })] })] }));
};
