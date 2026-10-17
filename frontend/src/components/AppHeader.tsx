import React, { useState } from 'react';
import { Menu, Zap } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../lib/api';
import { useMarket } from '../context/MarketContext';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  children?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  children,
}) => {
  const { isSimulating, setIsSimulating } = useMarket();
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  const handleSimulateTick = async (symbol: string) => {
    try {
      setIsSimulating(true);
      const res = await api.assets.simulateTick(symbol);
      setSimFeedback(`${symbol} → $${Number(res.current_price).toFixed(2)}`);
      setTimeout(() => setSimFeedback(null), 2500);
    } catch (err) {
      console.error('Failed to trigger simulation tick', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 -ml-1 text-text-muted hover:text-text-primary rounded-md hover:bg-surface transition-colors lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-semibold text-text-primary tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-text-muted hidden sm:block tracking-normal truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Children slots such as Portfolio selector */}
          {children}

          {/* Real-time simulation trigger */}
          <div className="hidden xl:flex items-center gap-1.5 h-8 border border-border-subtle bg-surface px-2.5 rounded-md text-xs shadow-subtle">
            <span className="text-[11px] text-text-muted font-mono flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber" />
              Tick Sim:
            </span>
            {(['AAPL', 'MSFT', 'GOOGL'] as const).map((sym) => (
              <button
                key={sym}
                disabled={isSimulating}
                onClick={() => handleSimulateTick(sym)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-text-secondary hover:text-amber hover:bg-surface-elevated transition-colors disabled:opacity-50"
                title={`Simulate real server-side market tick for ${sym}`}
              >
                {sym}
              </button>
            ))}
            {simFeedback && (
              <span className="ml-1 text-[10px] font-mono text-sage-text animate-fade-in font-medium">
                {simFeedback}
              </span>
            )}
          </div>

          <div className="hidden sm:block h-4 w-px bg-border" />

          {/* Market feed indicator */}
          <ConnectionStatus compact />

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
