import React from 'react';
import type { Holding } from '../types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { PortfolioMetricCard } from './PortfolioMetricCard';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Layers } from 'lucide-react';

import { computePortfolioSummary } from '../lib/financialMath';

interface PortfolioSummaryProps {
  holdings: Holding[];
  isLoading?: boolean;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ holdings, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <PortfolioMetricCard
            key={i}
            label="LOADING"
            value="—"
            subtitle=""
            icon={Wallet}
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  // Authoritative calculations from financialMath utility
  const {
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedPL,
    totalUnrealizedPLPercent,
    activePositionsCount,
  } = computePortfolioSummary(holdings);

  const isProfit = totalUnrealizedPL > 0;
  const isLoss = totalUnrealizedPL < 0;

  const plBadgeVariant = isProfit ? 'positive' : isLoss ? 'negative' : 'neutral';
  const plBadgeText = totalCostBasis > 0 ? formatPercent(totalUnrealizedPLPercent) : '0.00%';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Portfolio Market Value */}
      <PortfolioMetricCard
        label="Portfolio Market Value"
        value={formatCurrency(totalMarketValue)}
        subtitle={holdings.length === 0 ? 'No positions yet' : `${holdings.length} ${holdings.length === 1 ? 'position' : 'positions'}`}
        icon={Wallet}
      />

      {/* 2. Unrealized P&L */}
      <PortfolioMetricCard
        label="Net Unrealized P&L"
        value={
          <span className={isProfit ? 'text-sage-text' : isLoss ? 'text-coral-text' : 'text-text-primary'}>
            {isProfit ? `+${formatCurrency(totalUnrealizedPL)}` : formatCurrency(totalUnrealizedPL)}
          </span>
        }
        subtitle={isProfit ? 'Gain from initial fill' : isLoss ? 'Drawdown from cost' : 'At cost parity'}
        icon={isLoss ? TrendingDown : TrendingUp}
        badge={{
          text: plBadgeText,
          variant: plBadgeVariant,
        }}
      />

      {/* 3. Invested Cost Basis */}
      <PortfolioMetricCard
        label="Total Cost Basis"
        value={formatCurrency(totalCostBasis)}
        subtitle="Total purchase consideration deployed"
        icon={DollarSign}
      />

      {/* 4. Distinct Assets Held */}
      <PortfolioMetricCard
        label="Active Instruments"
        value={holdings.length}
        subtitle={holdings.length === 0 ? 'No equity positions open' : holdings.length === 1 ? '1 equity instrument' : `${holdings.length} equity instruments`}
        icon={Layers}
      />
    </div>
  );
};
