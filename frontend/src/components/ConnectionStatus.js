import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMarket } from '../context/MarketContext';
import { cn } from '../lib/utils';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
export const ConnectionStatus = ({ compact = false, className, }) => {
    const { connectionState, reconnect } = useMarket();
    const statusConfig = {
        Connected: {
            color: 'bg-sage-dim text-sage-text border-sage/30',
            dot: 'bg-sage animate-pulse-subtle',
            label: 'CONNECTED',
            sublabel: 'WebSocket streaming active',
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
        return (_jsxs("div", { className: cn('inline-flex items-center gap-2 h-8 px-2.5 rounded-md border text-xs font-mono tracking-wider uppercase shadow-subtle', statusConfig.color, className), title: `Market Feed: ${statusConfig.label} (${statusConfig.sublabel})`, children: [_jsx("span", { className: cn('w-1.5 h-1.5 rounded-full', statusConfig.dot) }), _jsx("span", { children: statusConfig.label }), isDisconnected && (_jsx("button", { onClick: reconnect, className: "ml-1 hover:underline text-text-primary focus:outline-none", "aria-label": "Retry connection", children: "Retry" }))] }));
    }
    return (_jsxs("div", { className: cn('flex items-center justify-between p-2.5 rounded border border-border-subtle bg-surface/50 text-xs', className), children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("span", { className: cn('w-2 h-2 rounded-full', statusConfig.dot) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5 font-mono font-medium tracking-wider text-text-primary", children: [_jsx("span", { children: "TERMINAL FEED" }), _jsx("span", { className: cn('text-[10px] px-1.5 py-0.2 rounded border', statusConfig.color), children: statusConfig.label })] }), _jsx("div", { className: "text-[11px] text-text-muted mt-0.5", children: statusConfig.sublabel })] })] }), isDisconnected && (_jsx("button", { onClick: reconnect, className: "px-2 py-1 text-[11px] font-mono text-amber hover:text-amber-hover border border-amber-border hover:border-amber rounded transition-colors", children: "Reconnect" }))] }));
};
