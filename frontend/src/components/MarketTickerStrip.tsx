import React, { useEffect, useState, useRef } from 'react';

interface TickerAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

// Seeded mock data — static since auth pages don't have WS context
const INITIAL_ASSETS: TickerAsset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.46, change: +1.28, changePct: +0.68 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.21, change: -0.87, changePct: -0.23 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.65, change: +2.11, changePct: +1.51 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 184.90, change: +0.45, changePct: +0.24 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 492.83, change: +8.34, changePct: +1.72 },
  { symbol: 'META', name: 'Meta Platforms', price: 503.77, change: -3.22, changePct: -0.64 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 247.19, change: +5.67, changePct: +2.35 },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 198.54, change: +0.92, changePct: +0.47 },
];

export const MarketTickerStrip: React.FC = () => {
  const [assets, setAssets] = useState<TickerAsset[]>(INITIAL_ASSETS);
  const intervalRef = useRef<number | null>(null);

  // Simulate micro price fluctuations so the ticker feels alive
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setAssets((prev) =>
        prev.map((a) => {
          const delta = (Math.random() - 0.48) * 0.5;
          const newPrice = Math.max(0.01, a.price + delta);
          const newChange = a.change + delta;
          const newChangePct = (newChange / (newPrice - newChange)) * 100;
          return { ...a, price: newPrice, change: newChange, changePct: newChangePct };
        })
      );
    }, 2200);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  // Duplicate for seamless loop
  const doubled = [...assets, ...assets];

  return (
    <div
      className="w-full overflow-hidden bg-surface/80 border-b border-border-subtle backdrop-blur-sm flex items-center"
      aria-label="Market prices"
    >
      <div className="flex-shrink-0 px-3 py-1.5 bg-surface-elevated border-r border-border-subtle flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-medium">
          MARKET PRICES
        </span>
      </div>
      <div className="overflow-hidden flex-1">
      <div
        className="flex items-center whitespace-nowrap"
        style={{ animation: 'tickerScroll 38s linear infinite' }}
      >
        {doubled.map((asset, idx) => {
          const isPositive = asset.changePct >= 0;
          return (
            <div
              key={`${asset.symbol}-${idx}`}
              className="inline-flex items-center gap-2 px-6 py-2 border-r border-border-subtle/60 flex-shrink-0"
            >
              <span className="font-mono font-bold text-xs text-text-primary tracking-wide">
                {asset.symbol}
              </span>
              <span className="font-mono text-xs text-text-primary tabular-nums">
                ${asset.price.toFixed(2)}
              </span>
              <span
                className={`font-mono text-[10px] font-semibold ${
                  isPositive ? 'text-sage-text' : 'text-coral-text'
                }`}
              >
                {isPositive ? '▲' : '▼'} {Math.abs(asset.changePct).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
