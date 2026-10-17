import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useMarket } from '../context/MarketContext';
import { AppHeader } from '../components/AppHeader';
import { PriceChangeIndicator } from '../components/PriceChangeIndicator';
import { OrderDialog } from '../components/OrderDialog';
import { PortfolioSelector } from '../components/PortfolioSelector';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Zap, RefreshCw, Activity } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys';
export const MarketsPage = () => {
    const { onOpenMobileMenu } = useOutletContext();
    const { livePrices, isSimulating, setIsSimulating } = useMarket();
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [orderType, setOrderType] = useState('BUY');
    const [orderSymbol, setOrderSymbol] = useState('AAPL');
    const { data: assets = [], isLoading, refetch } = useQuery({
        queryKey: queryKeys.assets.lists(),
        queryFn: api.assets.list,
        staleTime: 60000,
    });
    const handleTrade = (symbol, type) => {
        setOrderSymbol(symbol);
        setOrderType(type);
        setOrderDialogOpen(true);
    };
    const handleSimulateTick = async (symbol) => {
        try {
            setIsSimulating(true);
            await api.assets.simulateTick(symbol);
        }
        catch (err) {
            console.error(`Failed to simulate tick for ${symbol}:`, err);
        }
        finally {
            setIsSimulating(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(AppHeader, { title: "Market Surveillance", subtitle: "Real-time quote streaming via WebSocket & simulated execution ticks", onOpenMobileMenu: onOpenMobileMenu, children: _jsx(PortfolioSelector, {}) }), _jsxs("main", { className: "flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Activity, { className: "w-4 h-4 text-amber" }), _jsx("h2", { className: "text-sm font-semibold text-text-primary tracking-wide", children: "Active Trading Instruments" })] }), _jsx("p", { className: "text-xs text-text-muted mt-0.5", children: "Live quotes broadcast across Redis Pub/Sub through WebSocket pipeline" })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("button", { onClick: () => refetch(), className: "p-2 text-text-muted hover:text-text-primary rounded border border-border bg-surface hover:bg-surface-elevated transition-colors", title: "Refresh asset prices", "aria-label": "Refresh quotes", children: _jsx(RefreshCw, { className: "w-3.5 h-3.5" }) }) })] }), isLoading ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-44 rounded bg-surface border border-border animate-pulse" }, i))) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: assets.map((asset) => {
                            const liveData = livePrices[asset.symbol];
                            const currentPrice = liveData?.price ?? asset.current_price;
                            return (_jsxs("div", { className: "p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between hover:border-border-strong transition-colors", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "font-mono text-lg font-bold text-text-primary tracking-wide", children: asset.symbol }), _jsx("div", { className: "text-xs text-text-muted mt-0.5", children: asset.name })] }), _jsx("span", { className: "text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-border bg-surface-elevated text-text-muted", children: "EQUITY" })] }), _jsxs("div", { className: "mt-5", children: [_jsx("div", { className: "text-[10px] font-mono text-text-muted uppercase", children: "Spot Execution Quote" }), _jsx("div", { className: "mt-1", children: _jsx(PriceChangeIndicator, { price: currentPrice, showDirection: true, className: "text-2xl font-bold font-mono tracking-tight" }) }), _jsx("div", { className: "text-[11px] font-mono text-text-muted mt-1", children: liveData?.updatedAt
                                                            ? `Tick updated ${new Date(liveData.updatedAt).toLocaleTimeString()}`
                                                            : 'Cached price quote' })] })] }), _jsxs("div", { className: "pt-4 mt-4 border-t border-border-subtle flex items-center justify-between gap-2", children: [_jsxs("button", { onClick: () => handleSimulateTick(asset.symbol), disabled: isSimulating, className: "flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-amber hover:text-amber-hover bg-amber-muted border border-amber/30 hover:border-amber rounded transition-colors disabled:opacity-50", title: "Trigger simulated server-side tick", children: [_jsx(Zap, { className: "w-3 h-3" }), _jsx("span", { children: "Simulate Tick" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsxs("button", { onClick: () => handleTrade(asset.symbol, 'BUY'), className: "px-3 py-1.5 text-xs font-mono font-medium text-sage-text bg-sage-dim border border-sage/30 hover:border-sage rounded transition-colors", children: [_jsx(ArrowUpRight, { className: "w-3 h-3 inline mr-1" }), "Buy"] }), _jsxs("button", { onClick: () => handleTrade(asset.symbol, 'SELL'), className: "px-3 py-1.5 text-xs font-mono font-medium text-coral-text bg-coral-dim border border-coral/30 hover:border-coral rounded transition-colors", children: [_jsx(ArrowDownRight, { className: "w-3 h-3 inline mr-1" }), "Sell"] })] })] })] }, asset.symbol));
                        }) })), _jsxs("div", { className: "p-4 rounded bg-surface/50 border border-border text-xs text-text-secondary leading-relaxed", children: [_jsxs("div", { className: "flex items-center gap-2 font-mono font-medium text-text-primary mb-1", children: [_jsx(TrendingUp, { className: "w-4 h-4 text-amber" }), _jsx("span", { children: "Market Simulation Protocol" })] }), _jsxs("p", { className: "text-text-muted", children: ["The FinPulse backend simulates asset volatility through random percentage adjustments bounded between -1% and +1%. Each simulated tick is atomically written to PostgreSQL, invalidates Redis caching, and publishes an event to the ", _jsx("code", { className: "text-text-primary font-mono bg-surface-elevated px-1 py-0.5 rounded", children: "market:prices" }), " Redis Pub/Sub channel which streams to active WebSocket subscribers."] })] })] }), _jsx(OrderDialog, { isOpen: orderDialogOpen, onClose: () => setOrderDialogOpen(false), defaultType: orderType, defaultAssetSymbol: orderSymbol })] }));
};
