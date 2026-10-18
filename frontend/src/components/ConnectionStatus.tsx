import React from 'react';
import { useMarket } from '../context/MarketContext';
import { cn } from '../lib/utils';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  compact?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  compact = false,
  className,
}) => {
  const { connectionState, reconnect } = useMarket();

  const statusConfig = {
    Connected: {
      color: 'bg-sage-dim text-sage-text border-sage/30',
      dot: 'bg-sage animate-pulse-subtle',
      label: 'CONNECTED',
      sublabel: 'Live updates active',
      icon: Wifi,
    },
    Connecting: {
      color: 'bg-amber-muted text-amber border-amber/30',
      dot: 'bg-amber animate-pulse',
      label: 'CONNECTING',
      sublabel: 'Establishing feed',
      icon: RefreshCw,
    },
    Reconnecting: {
      color: 'bg-amber-muted text-amber border-amber/30',
      dot: 'bg-amber animate-pulse',
      label: 'RECONNECTING',
      sublabel: 'Backing off & retrying',
      icon: RefreshCw,
    },
    Disconnected: {
      color: 'bg-coral-dim text-coral-text border-coral/30',
      dot: 'bg-coral',
      label: 'DISCONNECTED',
      sublabel: 'Feed paused',
      icon: WifiOff,
    },
  }[connectionState] || {
    color: 'bg-coral-dim text-coral-text border-coral/30',
    dot: 'bg-coral',
    label: 'DISCONNECTED',
    sublabel: 'Feed paused',
    icon: WifiOff,
  };

  const isDisconnected = connectionState === 'Disconnected';

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 h-8 px-2.5 rounded-md border text-xs font-mono tracking-wider uppercase shadow-subtle',
          statusConfig.color,
          className
        )}
        title={`Market Feed: ${statusConfig.label} (${statusConfig.sublabel})`}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
        <span>{statusConfig.label}</span>
        {isDisconnected && (
          <button
            onClick={reconnect}
            className="ml-1 hover:underline text-text-primary focus:outline-none"
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2.5 rounded border border-border-subtle bg-surface/50 text-xs',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn('w-2 h-2 rounded-full', statusConfig.dot)} />
        <div>
          <div className="flex items-center gap-1.5 font-mono font-medium tracking-wider text-text-primary">
            <span>TERMINAL FEED</span>
            <span className={cn('text-[10px] px-1.5 py-0.2 rounded border', statusConfig.color)}>
              {statusConfig.label}
            </span>
          </div>
          <div className="text-[11px] text-text-muted mt-0.5">{statusConfig.sublabel}</div>
        </div>
      </div>
      {isDisconnected && (
        <button
          onClick={reconnect}
          className="px-2 py-1 text-[11px] font-mono text-amber hover:text-amber-hover border border-amber-border hover:border-amber rounded transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};
