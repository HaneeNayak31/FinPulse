import React from 'react';
import { cn } from '../lib/utils';

interface LoadingSkeletonProps {
  rows?: number;
  height?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 3,
  height = 'h-10',
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-full bg-surface-elevated/60 rounded border border-border-subtle animate-pulse',
            height
          )}
        />
      ))}
    </div>
  );
};
