import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Encountered Data Error',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-4 rounded-lg bg-coral-dim border border-coral/30 text-coral-text text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-text-primary text-xs font-mono">{title}</div>
          <p className="text-[11px] text-coral-text/90 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded border border-coral/40 bg-surface/40 hover:bg-surface text-text-primary self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};
