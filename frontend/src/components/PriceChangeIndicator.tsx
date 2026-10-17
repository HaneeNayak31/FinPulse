import React, { useEffect, useState, useRef } from 'react';
import { formatCurrency, cn } from '../lib/utils';

interface PriceChangeIndicatorProps {
  price: number;
  className?: string;
  showDirection?: boolean;
  prefix?: string;
}

export const PriceChangeIndicator: React.FC<PriceChangeIndicatorProps> = ({
  price,
  className,
  showDirection = false,
  prefix,
}) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number>(price);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevPriceRef.current !== price) {
      const isUp = price > prevPriceRef.current;
      setFlash(isUp ? 'up' : 'down');
      prevPriceRef.current = price;

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setFlash(null);
      }, 1200);
    }

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [price]);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors duration-300',
        flash === 'up' && 'bg-sage-dim text-sage-text ring-1 ring-sage/40',
        flash === 'down' && 'bg-coral-dim text-coral-text ring-1 ring-coral/40',
        !flash && 'text-text-primary',
        className
      )}
    >
      {prefix}
      {formatCurrency(price)}
      {showDirection && flash === 'up' && <span className="text-[10px] text-sage-text">▲</span>}
      {showDirection && flash === 'down' && <span className="text-[10px] text-coral-text">▼</span>}
    </span>
  );
};
