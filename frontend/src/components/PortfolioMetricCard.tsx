import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface PortfolioMetricCardProps {
  label: string;
  value: React.ReactNode;
  subtitle: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'negative' | 'neutral' | 'amber';
  };
  isLoading?: boolean;
  className?: string;
}

export const PortfolioMetricCard: React.FC<PortfolioMetricCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  badge,
  isLoading,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('p-5 rounded-lg bg-surface border border-border flex flex-col justify-between min-h-[144px]', className)}>
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-28 bg-surface-elevated rounded animate-pulse" />
          <div className="w-6 h-6 bg-surface-elevated rounded animate-pulse" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-7 w-36 bg-surface-elevated rounded animate-pulse" />
          <div className="h-3 w-44 bg-surface-elevated rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const badgeStyles = {
    positive: 'bg-sage-dim text-sage-text border-sage/30',
    negative: 'bg-coral-dim text-coral-text border-coral/30',
    neutral: 'bg-surface-elevated text-text-muted border-border',
    amber: 'bg-amber-muted text-amber border-amber/30',
  };

  return (
    <div
      className={cn(
        'p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between min-h-[148px] transition-colors hover:border-border-strong',
        className
      )}
    >
      {/* 1. Metric label and icon */}
      <div className="flex items-center justify-between text-text-muted mb-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-medium">
          {label}
        </span>
        <div className="p-1.5 rounded-md bg-surface-elevated text-text-secondary border border-border-subtle flex-shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 2. Main numeric value */}
      <div className="my-1">
        <div className="text-2xl font-bold font-mono tracking-tight text-text-primary tabular-nums">
          {value}
        </div>
      </div>

      {/* 3. Secondary badge & 4. Contextual caption (graceful wrap, zero collision) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        {badge && (
          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wider',
              badgeStyles[badge.variant]
            )}
          >
            {badge.text}
          </span>
        )}
        <span className="text-[11px] text-text-muted font-sans leading-relaxed">
          {subtitle}
        </span>
      </div>
    </div>
  );
};
