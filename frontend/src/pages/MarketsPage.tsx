import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useMarket } from '../context/MarketContext';
import { AppHeader } from '../components/AppHeader';
import { PriceChangeIndicator } from '../components/PriceChangeIndicator';
import { OrderDialog } from '../components/OrderDialog';
import { PortfolioSelector } from '../components/PortfolioSelector';
import { StockPriceChart } from '../components/StockPriceChart';
import type { OrderType, Asset } from '../types';
import { ArrowUpRight, ArrowDownRight, Zap, RefreshCw, Activity } from 'lucide-react';

import { queryKeys } from '../lib/queryKeys';

interface OutletContextType {
  onOpenMobileMenu: () => void;
}

export const MarketsPage: React.FC = () => {
  const { onOpenMobileMenu } = useOutletContext<OutletContextType>();
  const { livePrices, isSimulating, setIsSimulating } = useMarket();

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('BUY');
  const [orderSymbol, setOrderSymbol] = useState<string>('AAPL');

  const { data: assets = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.assets.lists(),
    queryFn: api.assets.list,
    staleTime: 60000,
  });

  const handleTrade = (symbol: string, type: OrderType) => {
    setOrderSymbol(symbol);
    setOrderType(type);
    setOrderDialogOpen(true);
  };

  const handleSimulateTick = async (symbol: string) => {
    try {
      setIsSimulating(true);
      await api.assets.simulateTick(symbol);
    } catch (err) {
      console.error(`Failed to update quote for ${symbol}:`, err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <>
      <AppHeader
        title="Markets"
        subtitle="Live prices and paper trading"
        onOpenMobileMenu={onOpenMobileMenu}
      >
        <PortfolioSelector />
      </AppHeader>

      <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber" />
              <h2 className="text-sm font-semibold text-text-primary tracking-wide">
                Watchlist
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Follow prices and place paper trades from one view
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 text-text-muted hover:text-text-primary rounded border border-border bg-surface hover:bg-surface-elevated transition-colors"
              title="Refresh asset prices"
              aria-label="Refresh quotes"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Asset Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assets.map((asset: Asset) => {
              const liveData = livePrices[asset.symbol];
              const currentPrice = liveData?.price ?? asset.current_price;

              return (
                <div
                  key={asset.symbol}
                  className="p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between hover:border-border-strong transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-lg font-bold text-text-primary tracking-wide">
                          {asset.symbol}
                        </span>
                        <div className="text-xs text-text-muted mt-0.5">{asset.name}</div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-border bg-surface-elevated text-text-muted">
                        EQUITY
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="text-[10px] font-mono text-text-muted uppercase">
                        Current price
                      </div>
                      <div className="mt-1">
                        <PriceChangeIndicator
                          price={currentPrice}
                          showDirection
                          className="text-2xl font-bold font-mono tracking-tight"
                        />
                      </div>
                      <StockPriceChart
                        symbol={asset.symbol}
                        price={currentPrice}
                        liveData={liveData}
                      />
                      <div className="text-[11px] font-mono text-text-muted mt-1">
                        {liveData?.updatedAt
                          ? `Tick updated ${new Date(liveData.updatedAt).toLocaleTimeString()}`
                          : 'Cached price quote'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSimulateTick(asset.symbol)}
                      disabled={isSimulating}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-amber hover:text-amber-hover bg-amber-muted border border-amber/30 hover:border-amber rounded transition-colors disabled:opacity-50"
                      title="Update this quote"
                    >
                      <Zap className="w-3 h-3" />
                        <span>Update quote</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTrade(asset.symbol, 'BUY')}
                        className="px-3 py-1.5 text-xs font-mono font-medium text-sage-text bg-sage-dim border border-sage/30 hover:border-sage rounded transition-colors"
                      >
                        <ArrowUpRight className="w-3 h-3 inline mr-1" />
                        Buy
                      </button>
                      <button
                        onClick={() => handleTrade(asset.symbol, 'SELL')}
                        className="px-3 py-1.5 text-xs font-mono font-medium text-coral-text bg-coral-dim border border-coral/30 hover:border-coral rounded transition-colors"
                      >
                        <ArrowDownRight className="w-3 h-3 inline mr-1" />
                        Sell
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <OrderDialog
        isOpen={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        defaultType={orderType}
        defaultAssetSymbol={orderSymbol}
      />
    </>
  );
};
