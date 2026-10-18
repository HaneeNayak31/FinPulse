import React from 'react';
import type { Holding } from '../types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon, Layers } from 'lucide-react';

import { computeAssetAllocations } from '../lib/financialMath';

interface PortfolioAllocationProps {
  holdings: Holding[];
  isLoading?: boolean;
  onOpenOrderDialog?: () => void;
  className?: string;
}

export const PortfolioAllocation: React.FC<PortfolioAllocationProps> = ({
  holdings,
  isLoading,
  onOpenOrderDialog,
  className,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className={`p-5 rounded-lg bg-surface border border-border flex flex-col justify-between h-full ${className || ''}`}>
        <div className="h-5 w-40 bg-surface-elevated rounded animate-pulse mb-4" />
        <div className="h-44 w-full bg-surface-elevated/40 rounded animate-pulse my-auto" />
      </div>
    );
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

  return (
    <div className={`p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between h-full ${className || ''}`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber" />
            <div>
              <h2 className="text-sm font-semibold text-text-primary tracking-wide">
                Asset Allocation
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Portfolio weight by position
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-border-subtle bg-surface-elevated text-text-secondary">
            {holdings.length} {holdings.length === 1 ? 'Position' : 'Positions'}
          </span>
        </div>

        {/* Empty State */}
        {holdings.length === 0 ? (
          <div className="py-10 px-4 text-center my-auto">
            <div className="w-10 h-10 rounded-full border border-border bg-surface-elevated flex items-center justify-center mx-auto text-text-muted mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-text-primary mb-1">
              No positions yet
            </p>
            <p className="text-[11px] text-text-muted max-w-xs mx-auto mb-4 leading-relaxed">
              Your allocation will appear here after you place your first trade.
            </p>
            {onOpenOrderDialog && (
              <button
                onClick={onOpenOrderDialog}
                className="px-3.5 py-1.5 text-xs font-mono font-medium text-black bg-amber hover:bg-amber-hover rounded transition-colors"
              >
                Place first trade
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Recharts Donut */}
            <div className="h-36 sm:h-40 w-full relative my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    innerRadius={46}
                    outerRadius={62}
                    paddingAngle={allocationData.length > 1 ? 3 : 0}
                    dataKey="value"
                  >
                    {allocationData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]}
                        stroke={chartStroke}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: tooltipText,
                      boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted">Market value</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-text-primary tabular-nums">
                  {formatCurrency(totalMarketValue)}
                </span>
              </div>
            </div>

            {/* Reconciled Legend with Visual Weight Bars */}
            <div className="space-y-2 mt-2 font-mono text-xs">
              {allocationData.map((item, idx) => {
                const color = ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length];
                return (
                  <div
                    key={item.name}
                    className="py-1.5 px-2 rounded hover:bg-surface-elevated/40 transition-colors border-b border-border-subtle/30 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-bold text-text-primary text-xs tracking-wide">{item.name}</span>
                        <span className="text-[11px] text-text-muted font-sans truncate max-w-[100px] sm:max-w-[130px]">
                          {item.fullName} · {item.shares} shs
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 tabular-nums">
                        <span className="text-text-secondary text-[11px]">{formatCurrency(item.value)}</span>
                        <span className="text-text-primary font-semibold text-xs w-12 text-right">
                          {formatPercent(item.percent)}
                        </span>
                      </div>
                    </div>
                    {/* Visual Weight Bar */}
                    <div className="w-full h-1 bg-border-subtle/70 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(2, item.percent)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 mt-4 border-t border-border-subtle text-[11px] font-mono text-text-muted flex items-center justify-between">
        <span>Allocation</span>
        <span className="text-text-primary font-medium">
          {totalMarketValue > 0 ? '100.00% Net Weight' : 'Unfunded'}
        </span>
      </div>
    </div>
  );
};
