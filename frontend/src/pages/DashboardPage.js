import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { usePortfolio } from '../context/PortfolioContext';
import { AppHeader } from '../components/AppHeader';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { MarketWatchlist } from '../components/MarketWatchlist';
import { PortfolioAllocation } from '../components/PortfolioAllocation';
import { OrderHistoryTable } from '../components/OrderHistoryTable';
import { ExecuteOrderDialog } from '../components/ExecuteOrderDialog';
import { PortfolioSelector } from '../components/PortfolioSelector';
import { CreatePortfolioDialog } from '../components/CreatePortfolioDialog';
import { EmptyState } from '../components/EmptyState';
import { Plus, ArrowRight, Briefcase } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys';
export const DashboardPage = () => {
    const { onOpenMobileMenu } = useOutletContext();
    const { activePortfolio, portfolios, isLoading: isLoadingPortfolios } = usePortfolio();
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [orderType, setOrderType] = useState('BUY');
    const [orderSymbol, setOrderSymbol] = useState('AAPL');
    const [createPortfolioOpen, setCreatePortfolioOpen] = useState(false);
    // Fetch holdings for active portfolio
    const { data: holdings = [], isLoading: isLoadingHoldings } = useQuery({
        queryKey: queryKeys.holdings.list(activePortfolio?.id),
        queryFn: () => (activePortfolio ? api.holdings.list(activePortfolio.id) : Promise.resolve([])),
        enabled: !!activePortfolio,
        staleTime: 10000,
    });
    // Fetch recent orders (first page, limit 5)
    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: queryKeys.orders.list(activePortfolio?.id, 1, 5),
        queryFn: () => activePortfolio
            ? api.orders.list(activePortfolio.id, 1, 5)
            : Promise.resolve({ orders: [], page: 1, limit: 5 }),
        enabled: !!activePortfolio,
        staleTime: 15000,
    });
    // Fetch assets list for symbol names
    const { data: assets = [] } = useQuery({
        queryKey: queryKeys.assets.lists(),
        queryFn: api.assets.list,
        staleTime: 60000,
    });
    const handleTradeAsset = (symbol, type) => {
        setOrderSymbol(symbol);
        setOrderType(type);
        setOrderDialogOpen(true);
    };
    return (_jsxs(_Fragment, { children: [_jsx(AppHeader, { title: "Terminal Overview", subtitle: "Real-time equity valuation, position distribution, and live asset surveillance", onOpenMobileMenu: onOpenMobileMenu, children: _jsx(PortfolioSelector, {}) }), _jsx("main", { className: "flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto", children: !isLoadingPortfolios && portfolios.length === 0 ? (_jsx(EmptyState, { title: "No Investment Book Initialized", description: "To begin monitoring equity instruments, tracking real-time unrealized P&L, and executing simulated paper orders, create your first portfolio book.", icon: Briefcase, action: {
                        label: 'Initialize First Portfolio Book',
                        onClick: () => setCreatePortfolioOpen(true),
                    } })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border-subtle", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("h1", { className: "text-xl sm:text-2xl font-sans font-bold text-text-primary tracking-tight", children: activePortfolio?.name || 'Investment Portfolio' }), _jsx("span", { className: "text-[10px] font-mono text-text-muted border border-border bg-surface px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Paper Trading \u00B7 USD" })] }), _jsx("p", { className: "text-xs text-text-muted mt-1 font-sans", children: "Real-time portfolio evaluation, asset weight distribution, and market order execution." })] }), _jsxs("div", { className: "flex items-center gap-2.5", children: [_jsxs(Link, { to: "/portfolio", className: "inline-flex items-center gap-1.5 h-8 px-3 text-xs font-mono font-medium text-text-secondary hover:text-text-primary bg-surface border border-border hover:border-border-strong hover:bg-surface-elevated rounded transition-colors shadow-subtle", children: [_jsx("span", { children: "Holdings Ledger" }), _jsx(ArrowRight, { className: "w-3 h-3 text-text-muted" })] }), _jsxs("button", { onClick: () => handleTradeAsset('AAPL', 'BUY'), className: "inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-mono font-bold text-black bg-amber hover:bg-amber-hover rounded transition-colors shadow-subtle", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Execute Order" })] })] })] }), _jsx(PortfolioSummary, { holdings: holdings, isLoading: isLoadingHoldings }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch", children: [_jsx("div", { className: "lg:col-span-7 flex", children: _jsx(MarketWatchlist, { onSelectAssetForOrder: handleTradeAsset, className: "w-full" }) }), _jsx("div", { className: "lg:col-span-5 flex", children: _jsx(PortfolioAllocation, { holdings: holdings, isLoading: isLoadingHoldings, onOpenOrderDialog: () => handleTradeAsset('AAPL', 'BUY'), className: "w-full" }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("span", { className: "text-xs font-mono uppercase tracking-widest text-text-muted", children: "Recent Ledger Activity" }), _jsxs(Link, { to: "/orders", className: "text-xs font-mono text-amber hover:underline flex items-center gap-1", children: [_jsx("span", { children: "Full Order Audit Trail" }), _jsx(ArrowRight, { className: "w-3 h-3" })] })] }), _jsx(OrderHistoryTable, { orders: ordersData?.orders || [], assets: assets, page: 1, limit: 5, onPageChange: () => { }, isLoading: isLoadingOrders, onOpenOrderDialog: () => handleTradeAsset('AAPL', 'BUY') })] })] })) }), _jsx(ExecuteOrderDialog, { isOpen: orderDialogOpen, onClose: () => setOrderDialogOpen(false), defaultType: orderType, defaultAssetSymbol: orderSymbol }), _jsx(CreatePortfolioDialog, { isOpen: createPortfolioOpen, onClose: () => setCreatePortfolioOpen(false) })] }));
};
