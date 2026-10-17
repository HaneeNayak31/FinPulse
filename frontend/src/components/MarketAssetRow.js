import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PriceChangeIndicator } from './PriceChangeIndicator';
import { useMarket } from '../context/MarketContext';
import { Zap } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
export const MarketAssetRow = ({ asset, onTrade }) => {
    const { livePrices, isSimulating, setIsSimulating } = useMarket();
    const liveData = livePrices[asset.symbol];
    const currentPrice = liveData?.price ?? asset.current_price;
    const previousPrice = liveData?.previousPrice;
    // Compute movement delta if previous price exists
    const hasDelta = previousPrice !== null && previousPrice !== undefined && previousPrice !== currentPrice;
    const delta = hasDelta ? currentPrice - previousPrice : 0;
    const deltaPct = hasDelta && previousPrice > 0 ? (delta / previousPrice) * 100 : 0;
    const handleSimulateTick = async (e) => {
        e.stopPropagation();
        try {
            setIsSimulating(true);
            await api.assets.simulateTick(asset.symbol);
        }
        catch (err) {
            console.error(`Failed to trigger simulation tick for ${asset.symbol}`, err);
        }
        finally {
            setIsSimulating(false);
        }
    };
    return (_jsxs("tr", { className: cn('group transition-colors duration-150 hover:bg-surface-elevated/40', liveData?.changeDirection === 'up' && 'animate-flash-sage', liveData?.changeDirection === 'down' && 'animate-flash-coral'), children: [_jsx("td", { className: "py-3 pl-1 pr-3", children: _jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [_jsx("span", { className: "font-mono font-bold text-xs text-text-primary tracking-wide", children: asset.symbol }), _jsx("span", { className: "text-[11px] text-text-muted font-sans truncate max-w-[120px] sm:max-w-[170px]", children: asset.name })] }) }), _jsx("td", { className: "py-3 px-2 text-right tabular-nums", children: _jsx(PriceChangeIndicator, { price: currentPrice, showDirection: true, className: "text-xs sm:text-sm font-semibold" }) }), _jsx("td", { className: "py-3 px-2 text-right tabular-nums", children: hasDelta ? (_jsxs("span", { className: cn('text-xs font-semibold', delta >= 0 ? 'text-sage-text' : 'text-coral-text'), children: [delta >= 0 ? '+' : '', deltaPct.toFixed(2), "%"] })) : (_jsx("span", { className: "text-text-muted text-[11px]", children: "\u2014" })) }), _jsx("td", { className: "py-3 pl-2 pr-1 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [_jsx("button", { onClick: handleSimulateTick, disabled: isSimulating, className: "p-1 rounded text-text-muted hover:text-amber hover:bg-surface border border-transparent hover:border-border transition-colors disabled:opacity-30", title: `Simulate tick for ${asset.symbol}`, "aria-label": `Simulate tick for ${asset.symbol}`, children: _jsx(Zap, { className: "w-3.5 h-3.5" }) }), _jsx("button", { onClick: () => onTrade(asset.symbol, 'BUY'), className: "px-2.5 py-1 text-xs font-mono font-medium text-text-primary bg-surface hover:bg-surface-elevated border border-border hover:border-amber hover:text-amber rounded transition-colors shadow-subtle", children: "Trade" })] }) })] }));
};
