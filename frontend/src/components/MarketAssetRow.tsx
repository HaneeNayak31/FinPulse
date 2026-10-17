import React from 'react';
import type { Asset, OrderType } from '../types';
import { PriceChangeIndicator } from './PriceChangeIndicator';
import { useMarket } from '../context/MarketContext';
import { ArrowUpRight, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface MarketAssetRowProps {
  asset: Asset;
  onTrade: (symbol: string, type: OrderType) => void;
}

export const MarketAssetRow: React.FC<MarketAssetRowProps> = ({ asset, onTrade }) => {
  const { livePrices, isSimulating, setIsSimulating } = useMarket();

  const liveData = livePrices[asset.symbol];
  const currentPrice = liveData?.price ?? asset.current_price;
  const previousPrice = liveData?.previousPrice;

  // Compute movement delta if previous price exists
  const hasDelta = previousPrice !== null && previousPrice !== undefined && previousPrice !== currentPrice;
  const delta = hasDelta ? currentPrice - previousPrice! : 0;
  const deltaPct = hasDelta && previousPrice! > 0 ? (delta / previousPrice!) * 100 : 0;

  const handleSimulateTick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsSimulating(true);
      await api.assets.simulateTick(asset.symbol);
    } catch (err) {
      console.error(`Failed to trigger simulation tick for ${asset.symbol}`, err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <tr
      className={cn(
        'group transition-colors duration-150 hover:bg-surface-elevated/40',
        liveData?.changeDirection === 'up' && 'animate-flash-sage',
        liveData?.changeDirection === 'down' && 'animate-flash-coral'
      )}
    >
      {/* 1. Symbol & Company Name */}
      <td className="py-3 pl-1 pr-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono font-bold text-xs text-text-primary tracking-wide">
            {asset.symbol}
          </span>
          <span className="text-[11px] text-text-muted font-sans truncate max-w-[120px] sm:max-w-[170px]">
            {asset.name}
          </span>
        </div>
      </td>

      {/* 2. Current Price */}
      <td className="py-3 px-2 text-right tabular-nums">
        <PriceChangeIndicator
          price={currentPrice}
          showDirection
          className="text-xs sm:text-sm font-semibold"
        />
      </td>

      {/* 3. Movement Delta */}
      <td className="py-3 px-2 text-right tabular-nums">
        {hasDelta ? (
          <span className={cn('text-xs font-semibold', delta >= 0 ? 'text-sage-text' : 'text-coral-text')}>
            {delta >= 0 ? '+' : ''}{deltaPct.toFixed(2)}%
          </span>
        ) : (
          <span className="text-text-muted text-[11px]">—</span>
        )}
      </td>

      {/* 4. Action */}
      <td className="py-3 pl-2 pr-1 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={handleSimulateTick}
            disabled={isSimulating}
            className="p-1 rounded text-text-muted hover:text-amber hover:bg-surface border border-transparent hover:border-border transition-colors disabled:opacity-30"
            title={`Simulate tick for ${asset.symbol}`}
            aria-label={`Simulate tick for ${asset.symbol}`}
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onTrade(asset.symbol, 'BUY')}
            className="px-2.5 py-1 text-xs font-mono font-medium text-text-primary bg-surface hover:bg-surface-elevated border border-border hover:border-amber hover:text-amber rounded transition-colors shadow-subtle"
          >
            Trade
          </button>
        </div>
      </td>
    </tr>
  );
};
