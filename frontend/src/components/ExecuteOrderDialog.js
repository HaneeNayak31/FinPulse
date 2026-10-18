import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useMarket } from '../context/MarketContext';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { queryKeys } from '../lib/queryKeys';
import { X, Loader2, ArrowUpRight, ArrowDownRight, ShieldAlert, CheckCircle2, AlertTriangle, Receipt, } from 'lucide-react';
export const ExecuteOrderDialog = ({ isOpen, onClose, defaultType = 'BUY', defaultAssetSymbol = 'AAPL', }) => {
    const queryClient = useQueryClient();
    const { activePortfolio } = usePortfolio();
    const { livePrices } = useMarket();
    const [orderType, setOrderType] = useState(defaultType);
    const [selectedSymbol, setSelectedSymbol] = useState(defaultAssetSymbol);
    const [quantityStr, setQuantityStr] = useState('1');
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    useEffect(() => {
        if (isOpen) {
            setOrderType(defaultType);
            setSelectedSymbol(defaultAssetSymbol);
            setQuantityStr('1');
            setIsReviewMode(false);
            setError(null);
            setSuccessMessage(null);
        }
    }, [isOpen, defaultType, defaultAssetSymbol]);
    // Fetch available assets
    const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
        queryKey: queryKeys.assets.lists(),
        queryFn: api.assets.list,
        enabled: isOpen,
        staleTime: 60000,
    });
    // Fetch holdings to check available balance on SELL
    const { data: holdings = [] } = useQuery({
        queryKey: queryKeys.holdings.list(activePortfolio?.id),
        queryFn: () => (activePortfolio ? api.holdings.list(activePortfolio.id) : Promise.resolve([])),
        enabled: isOpen && !!activePortfolio,
        staleTime: 10000,
    });
    const selectedAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];
    const holdingForAsset = holdings.find((h) => h.symbol === selectedSymbol);
    const availableShares = holdingForAsset?.quantity || 0;
    // Real-time market price
    const livePriceData = livePrices[selectedSymbol];
    const activePrice = livePriceData?.price ?? selectedAsset?.current_price ?? 0;
    const quantity = parseFloat(quantityStr) || 0;
    const estimatedTotal = quantity * activePrice;
    const isSell = orderType === 'SELL';
    const hasInsufficientShares = isSell && quantity > availableShares;
    const isInvalidQuantity = quantity <= 0 || !Number.isFinite(quantity);
    const orderMutation = useMutation({
        mutationFn: async () => {
            if (!activePortfolio)
                throw new Error('No active portfolio selected');
            if (!selectedAsset)
                throw new Error('No asset selected');
            if (isInvalidQuantity)
                throw new Error('Quantity must be greater than zero');
            if (hasInsufficientShares) {
                throw new Error(`Cannot sell ${quantity} shares; only ${availableShares} shares owned.`);
            }
            return api.orders.create(activePortfolio.id, {
                asset_id: selectedAsset.id,
                type: orderType,
                quantity,
            });
        },
        onSuccess: (newOrder) => {
            setSuccessMessage(`${newOrder.type === 'BUY' ? 'Bought' : 'Sold'} ${newOrder.quantity} ${selectedSymbol} at ${formatCurrency(newOrder.price)} (${formatCurrency(Number(newOrder.quantity) * Number(newOrder.price))} total)`);
            // Targeted invalidation of active portfolio holdings and orders
            if (activePortfolio) {
                queryClient.invalidateQueries({ queryKey: queryKeys.holdings.list(activePortfolio.id) });
                queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.portfolios.all });
            setTimeout(() => {
                onClose();
            }, 1600);
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : 'Order submission failed.');
            setIsReviewMode(false);
        },
    });
    if (!isOpen)
        return null;
    const handleMaxClick = () => {
        if (availableShares > 0) {
            setQuantityStr(String(availableShares));
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in", children: _jsxs("div", { className: "w-full max-w-lg p-6 bg-surface border border-border rounded-lg shadow-2xl relative", children: [_jsx("button", { onClick: onClose, disabled: orderMutation.isPending, className: "absolute top-4 right-4 p-1 rounded text-text-muted hover:text-text-primary transition-colors disabled:opacity-50", "aria-label": "Close order dialog", children: _jsx(X, { className: "w-4 h-4" }) }), _jsxs("div", { className: "flex items-center justify-between mb-4 pb-3 border-b border-border-subtle", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Receipt, { className: "w-4 h-4 text-amber" }), _jsx("h2", { className: "text-base font-semibold text-text-primary tracking-wide", children: "Place a trade" })] }), _jsxs("p", { className: "text-xs text-text-muted mt-0.5", children: ["Portfolio Book:", ' ', _jsx("span", { className: "text-text-primary font-medium font-mono", children: activePortfolio?.name || 'Primary' })] })] }), _jsx("span", { className: "text-[10px] font-mono tracking-widest text-amber border border-amber/30 bg-amber-muted px-2 py-0.5 rounded", children: "SIMULATED" })] }), successMessage && (_jsxs("div", { className: "p-3 mb-4 rounded text-xs bg-sage-dim border border-sage/30 text-sage-text flex items-start gap-2", children: [_jsx(CheckCircle2, { className: "w-4 h-4 flex-shrink-0 mt-0.5" }), _jsx("span", { className: "font-mono", children: successMessage })] })), error && (_jsxs("div", { className: "p-3 mb-4 rounded text-xs bg-coral-dim border border-coral/30 text-coral-text flex items-start gap-2", children: [_jsx(ShieldAlert, { className: "w-4 h-4 flex-shrink-0 mt-0.5" }), _jsx("span", { children: error })] })), !isReviewMode ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 p-1 bg-surface-elevated rounded border border-border-subtle", children: [_jsxs("button", { type: "button", onClick: () => setOrderType('BUY'), className: cn('flex items-center justify-center gap-2 py-2 text-xs font-mono font-medium rounded transition-all', orderType === 'BUY'
                                        ? 'bg-sage-dim text-sage-text border border-sage/40 shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'), children: [_jsx(ArrowUpRight, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "BUY ORDER" })] }), _jsxs("button", { type: "button", onClick: () => setOrderType('SELL'), className: cn('flex items-center justify-center gap-2 py-2 text-xs font-mono font-medium rounded transition-all', orderType === 'SELL'
                                        ? 'bg-coral-dim text-coral-text border border-coral/40 shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'), children: [_jsx(ArrowDownRight, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "SELL ORDER" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5", children: "Instrument" }), isLoadingAssets ? (_jsx("div", { className: "h-10 bg-surface-elevated rounded animate-pulse" })) : (_jsx("div", { className: "grid grid-cols-3 gap-2", children: assets.map((asset) => {
                                        const isSelected = asset.symbol === selectedSymbol;
                                        const live = livePrices[asset.symbol]?.price ?? asset.current_price;
                                        return (_jsxs("button", { type: "button", onClick: () => setSelectedSymbol(asset.symbol), className: cn('p-2.5 rounded border text-left transition-all', isSelected
                                                ? 'border-amber bg-surface-elevated text-text-primary'
                                                : 'border-border bg-surface hover:border-border-strong text-text-secondary'), children: [_jsx("div", { className: "font-mono font-bold text-xs text-text-primary", children: asset.symbol }), _jsx("div", { className: "text-[10px] text-text-muted truncate mb-1", children: asset.name }), _jsx("div", { className: "font-mono text-xs tabular-nums text-amber", children: formatCurrency(live) })] }, asset.symbol));
                                    }) }))] }), _jsxs("div", { className: "p-3 rounded bg-surface-elevated/70 border border-border-subtle grid grid-cols-2 gap-3 text-xs", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-mono uppercase text-text-muted", children: "Market Quote" }), _jsx("div", { className: "font-mono text-sm font-semibold text-text-primary mt-0.5", children: formatCurrency(activePrice) }), _jsx("div", { className: "text-[10px] text-text-muted mt-0.5", children: "Live streaming rate" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-mono uppercase text-text-muted", children: "Owned Balance" }), _jsxs("div", { className: "font-mono text-sm font-semibold text-text-primary mt-0.5", children: [formatNumber(availableShares, 4), " shares"] }), _jsx("div", { className: "text-[10px] text-text-muted mt-0.5", children: isSell && availableShares === 0 ? 'No shares to sell' : 'Available in book' })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsx("label", { htmlFor: "dialog-quantity", className: "block text-xs font-mono uppercase tracking-wider text-text-muted", children: "Order Quantity (Shares)" }), isSell && availableShares > 0 && (_jsxs("button", { type: "button", onClick: handleMaxClick, className: "text-[10px] font-mono text-amber hover:underline uppercase", children: ["Sell Max (", formatNumber(availableShares, 2), ")"] }))] }), _jsx("input", { id: "dialog-quantity", type: "number", min: "0.0001", step: "any", value: quantityStr, onChange: (e) => setQuantityStr(e.target.value), placeholder: "1", className: cn('w-full px-3 py-2 text-sm font-mono bg-surface-elevated border rounded text-text-primary focus:outline-none transition-colors', hasInsufficientShares ? 'border-coral' : 'border-border focus:border-amber'), disabled: orderMutation.isPending }), hasInsufficientShares && (_jsxs("p", { className: "text-[11px] text-coral-text mt-1 flex items-center gap-1 font-mono", children: [_jsx(AlertTriangle, { className: "w-3 h-3" }), "Cannot sell more shares than currently owned (", formatNumber(availableShares, 4), ")."] }))] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded bg-surface-elevated border border-border-subtle font-mono text-xs", children: [_jsx("span", { className: "text-text-muted uppercase", children: "Estimated Gross Value:" }), _jsx("span", { className: "text-base font-bold text-text-primary tabular-nums", children: formatCurrency(estimatedTotal) })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-3 border-t border-border-subtle", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded border border-transparent hover:border-border transition-colors", children: "Cancel" }), _jsxs("button", { type: "button", disabled: isInvalidQuantity || hasInsufficientShares || !activePortfolio, onClick: () => setIsReviewMode(true), className: cn('px-4 py-2 text-xs font-mono font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed', orderType === 'BUY'
                                        ? 'bg-sage text-black hover:bg-sage/90'
                                        : 'bg-coral text-black hover:bg-coral/90'), children: ["Review ", orderType, " Order"] })] })] })) : (_jsxs("div", { className: "space-y-4 animate-fade-in", children: [_jsxs("div", { className: "p-4 rounded-lg bg-surface-elevated border border-border-subtle space-y-3 font-mono text-xs", children: [_jsx("div", { className: "text-[10px] uppercase text-text-muted tracking-wider border-b border-border-subtle pb-2", children: "Order Review & Authorization" }), _jsxs("div", { className: "flex justify-between py-1 border-b border-border-subtle/50", children: [_jsx("span", { className: "text-text-muted", children: "Transaction Type" }), _jsx("span", { className: cn('font-bold px-1.5 py-0.2 rounded text-[11px]', orderType === 'BUY' ? 'bg-sage-dim text-sage-text' : 'bg-coral-dim text-coral-text'), children: orderType })] }), _jsxs("div", { className: "flex justify-between py-1 border-b border-border-subtle/50", children: [_jsx("span", { className: "text-text-muted", children: "Instrument" }), _jsxs("span", { className: "text-text-primary font-bold", children: [selectedSymbol, " (", selectedAsset?.name, ")"] })] }), _jsxs("div", { className: "flex justify-between py-1 border-b border-border-subtle/50", children: [_jsx("span", { className: "text-text-muted", children: "Execution Quantity" }), _jsxs("span", { className: "text-text-primary font-bold tabular-nums", children: [formatNumber(quantity, 4), " Shares"] })] }), _jsxs("div", { className: "flex justify-between py-1 border-b border-border-subtle/50", children: [_jsx("span", { className: "text-text-muted", children: "Estimated Unit Price" }), _jsx("span", { className: "text-text-primary tabular-nums", children: formatCurrency(activePrice) })] }), _jsxs("div", { className: "flex justify-between pt-1", children: [_jsx("span", { className: "text-text-secondary uppercase", children: "Gross Consideration" }), _jsx("span", { className: "text-base font-bold text-amber tabular-nums", children: formatCurrency(estimatedTotal) })] })] }), _jsx("p", { className: "text-[11px] text-text-muted font-mono leading-relaxed", children: "Execution is recorded atomically into PostgreSQL ledger. Price is locked at server execution timestamp." }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-3 border-t border-border-subtle", children: [_jsx("button", { type: "button", onClick: () => setIsReviewMode(false), disabled: orderMutation.isPending, className: "px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded border border-transparent hover:border-border transition-colors disabled:opacity-50", children: "Back to Edit" }), _jsxs("button", { type: "button", disabled: orderMutation.isPending, onClick: () => orderMutation.mutate(), className: cn('flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed', orderType === 'BUY'
                                        ? 'bg-sage text-black hover:bg-sage/90'
                                        : 'bg-coral text-black hover:bg-coral/90'), children: [orderMutation.isPending && _jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }), _jsx("span", { children: orderMutation.isPending
                                                ? 'Submitting to Ledger...'
                                                : `Confirm ${orderType === 'BUY' ? 'buy' : 'sell'}` })] })] })] }))] }) }));
};
export const OrderDialog = ExecuteOrderDialog;
