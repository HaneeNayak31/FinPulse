import React from 'react';
import type { Holding, OrderType } from '../types';
import { useMarket } from '../context/MarketContext';
import { PriceChangeIndicator } from './PriceChangeIndicator';
import { formatCurrency, formatNumber, formatPercent, cn } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, Inbox, Plus } from 'lucide-react';

import { computeHoldingMetrics } from '../lib/financialMath';

interface PortfolioHoldingsTableProps {
  holdings: Holding[];
  isLoading?: boolean;
  onTrade: (symbol: string, type: OrderType) => void;
  onOpenOrderDialog: () => void;
  className?: string;
}

export const PortfolioHoldingsTable: React.FC<PortfolioHoldingsTableProps> = ({
  holdings,
  isLoading,
  onTrade,
  onOpenOrderDialog,
  className,
}) => {
  const { livePrices } = useMarket();

  if (isLoading) {
    return (
      <div className={`p-4 rounded-lg bg-surface border border-border ${className || ''}`}>
        <div className="h-5 w-40 bg-surface-elevated rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface-elevated/40 rounded border border-border-subtle animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className={`p-8 rounded-lg bg-surface border border-border text-center ${className || ''}`}>
        <div className="w-10 h-10 rounded-full border border-border bg-surface-elevated flex items-center justify-center mx-auto text-text-muted mb-3">
          <Inbox className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          No Holdings in this Book
        </h3>
        <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
          Execute a simulated market order to acquire shares of AAPL, MSFT, or GOOGL.
        </p>
        <button
          onClick={onOpenOrderDialog}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-black bg-amber hover:bg-amber-hover rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Place First Buy Order</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-surface border border-border shadow-subtle overflow-hidden ${className || ''}`}>
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div>
          <h2 className="text-sm font-semibold text-text-primary tracking-wide">
            Portfolio Holdings Ledger
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            Real-time equity positions, book basis, and computed return
          </p>
        </div>
        <button
          onClick={onOpenOrderDialog}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-amber bg-amber-muted border border-amber/40 hover:border-amber rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Order</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-elevated/40 text-[10px] font-mono uppercase tracking-wider text-text-muted">
              <th className="py-3 px-4 font-medium">Instrument</th>
              <th className="py-3 px-4 font-medium text-right">Shares</th>
              <th className="py-3 px-4 font-medium text-right">Avg Purchase</th>
              <th className="py-3 px-4 font-medium text-right">Current Price</th>
              <th className="py-3 px-4 font-medium text-right">Market Value</th>
              <th className="py-3 px-4 font-medium text-right">Unrealized P&L</th>
              <th className="py-3 px-4 font-medium text-center">Trade Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-mono">
            {holdings.map((h) => {
              const liveData = livePrices[h.symbol];
              const currentPrice = liveData?.price ?? h.current_price;
              const {
                marketValue,
                unrealizedPL,
                unrealizedPLPercent,
              } = computeHoldingMetrics(h.quantity, h.average_price, currentPrice);

              const isProfit = unrealizedPL > 0;
              const isLoss = unrealizedPL < 0;
              const priceDirection = liveData?.changeDirection;

              return (
                <tr
                  key={h.id}
                  className={cn(
                    'transition-colors duration-150 hover:bg-surface-elevated/30',
                    priceDirection === 'up' && 'animate-flash-sage',
                    priceDirection === 'down' && 'animate-flash-coral'
                  )}
                >
                  {/* Asset */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-text-primary text-xs flex items-center gap-2">
                      <span className="w-6 h-6 rounded border border-border-strong bg-surface-elevated flex items-center justify-center text-[10px] text-amber">
                        {h.symbol.slice(0, 2)}
                      </span>
                      <span>{h.symbol}</span>
                    </div>
                    <div className="text-[10px] text-text-muted font-sans ml-8 truncate max-w-[150px]">
                      {h.name}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">
                    {formatNumber(h.quantity, 4)}
                  </td>

                  {/* Average Price */}
                  <td className="py-3 px-4 text-right tabular-nums text-text-secondary">
                    {formatCurrency(h.average_price)}
                  </td>

                  {/* Current Price */}
                  <td className="py-3 px-4 text-right tabular-nums">
                    <PriceChangeIndicator price={currentPrice} />
                  </td>

                  {/* Market Value */}
                  <td className="py-3 px-4 text-right tabular-nums text-text-primary font-bold">
                    {formatCurrency(marketValue)}
                  </td>

                  {/* Unrealized P&L */}
                  <td className="py-3 px-4 text-right tabular-nums">
                    <div
                      className={cn(
                        'font-bold',
                        isProfit ? 'text-sage-text' : isLoss ? 'text-coral-text' : 'text-text-primary'
                      )}
                    >
                      {isProfit ? `+${formatCurrency(unrealizedPL)}` : formatCurrency(unrealizedPL)}
                    </div>
                    <div
                      className={cn(
                        'text-[10px] font-medium',
                        isProfit ? 'text-sage-text' : isLoss ? 'text-coral-text' : 'text-text-muted'
                      )}
                    >
                      {formatPercent(unrealizedPLPercent)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onTrade(h.symbol, 'BUY')}
                        className="px-2 py-1 text-[11px] font-medium text-sage-text hover:bg-sage-dim rounded border border-sage/30 hover:border-sage transition-colors"
                        title={`Buy more ${h.symbol}`}
                      >
                        <ArrowUpRight className="w-3 h-3 inline mr-0.5" />
                        Buy
                      </button>
                      <button
                        onClick={() => onTrade(h.symbol, 'SELL')}
                        className="px-2 py-1 text-[11px] font-medium text-coral-text hover:bg-coral-dim rounded border border-coral/30 hover:border-coral transition-colors"
                        title={`Sell ${h.symbol}`}
                      >
                        <ArrowDownRight className="w-3 h-3 inline mr-0.5" />
                        Sell
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const HoldingsTable = PortfolioHoldingsTable;
