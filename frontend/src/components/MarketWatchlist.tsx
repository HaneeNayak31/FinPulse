import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MarketAssetRow } from './MarketAssetRow';
import type { OrderType, Asset } from '../types';
import { TrendingUp, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface MarketWatchlistProps {
  onSelectAssetForOrder: (symbol: string, type: OrderType) => void;
  className?: string;
}

export const MarketWatchlist: React.FC<MarketWatchlistProps> = ({
  onSelectAssetForOrder,
  className,
}) => {
  const {
    data: assets = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['assets'],
    queryFn: api.assets.list,
    staleTime: 60000,
  });

  return (
    <div className={`p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between h-full ${className || ''}`}>
      <div>
        {/* Watchlist Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber" />
            <div>
              <h2 className="text-sm font-semibold text-text-primary tracking-wide">
                Market watchlist
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Live prices for the assets you can trade
              </p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 text-text-muted hover:text-text-primary rounded border border-border-subtle hover:border-border bg-surface-elevated/40 transition-colors disabled:opacity-40"
            title="Refresh asset prices"
            aria-label="Refresh quotes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-surface-elevated/60 animate-pulse border border-border-subtle" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-4 my-2 rounded bg-coral-dim border border-coral/30 text-coral-text text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Failed to fetch market quotes: {error instanceof Error ? error.message : 'Network error'}</span>
            </div>
            <button
              onClick={() => refetch()}
              className="underline font-mono text-[11px] hover:text-text-primary"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && assets.length === 0 && (
          <div className="py-8 text-center text-xs text-text-muted font-mono">
            No market instruments currently registered.
          </div>
        )}

        {/* Unified Market Table */}
        {!isLoading && !isError && assets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  <th className="py-2.5 pl-1 font-medium">Instrument</th>
                  <th className="py-2.5 px-2 font-medium text-right">Quote</th>
                  <th className="py-2.5 px-2 font-medium text-right">Delta</th>
                  <th className="py-2.5 pr-1 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 font-mono">
                {assets.map((asset: Asset) => (
                  <MarketAssetRow
                    key={asset.symbol}
                    asset={asset}
                    onTrade={onSelectAssetForOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclaimers & Info */}
      <div className="pt-3 mt-4 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
        <div className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-amber" />
          <span>Paper-trading prices</span>
        </div>
        <span>Live updates</span>
      </div>
    </div>
  );
};
