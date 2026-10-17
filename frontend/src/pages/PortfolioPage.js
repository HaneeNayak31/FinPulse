import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { usePortfolio } from '../context/PortfolioContext';
import { AppHeader } from '../components/AppHeader';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { PortfolioHoldingsTable } from '../components/PortfolioHoldingsTable';
import { OrderHistoryTable } from '../components/OrderHistoryTable';
import { ExecuteOrderDialog } from '../components/ExecuteOrderDialog';
import { PortfolioSelector } from '../components/PortfolioSelector';
import { CreatePortfolioDialog } from '../components/CreatePortfolioDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Plus, RefreshCw, Briefcase } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys';
export const PortfolioPage = () => {
    const { onOpenMobileMenu } = useOutletContext();
    const { activePortfolio, portfolios, isLoading: isLoadingPortfolios } = usePortfolio();
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [orderType, setOrderType] = useState('BUY');
    const [orderSymbol, setOrderSymbol] = useState('AAPL');
    const [createPortfolioOpen, setCreatePortfolioOpen] = useState(false);
    const [ordersPage, setOrdersPage] = useState(1);
    const ordersLimit = 10;
    // Holdings query
    const { data: holdings = [], isLoading: isLoadingHoldings, isError: isHoldingsError, error: holdingsError, refetch: refetchHoldings, isFetching: isFetchingHoldings, } = useQuery({
        queryKey: queryKeys.holdings.list(activePortfolio?.id),
        queryFn: () => (activePortfolio ? api.holdings.list(activePortfolio.id) : Promise.resolve([])),
        enabled: !!activePortfolio,
        staleTime: 10000,
    });
    // Orders query with pagination
    const { data: ordersData, isLoading: isLoadingOrders, refetch: refetchOrders, } = useQuery({
        queryKey: queryKeys.orders.list(activePortfolio?.id, ordersPage, ordersLimit),
        queryFn: () => activePortfolio
            ? api.orders.list(activePortfolio.id, ordersPage, ordersLimit)
            : Promise.resolve({ orders: [], page: 1, limit: ordersLimit }),
        enabled: !!activePortfolio,
        staleTime: 15000,
    });
    // Assets query for symbol lookup
    const { data: assets = [] } = useQuery({
        queryKey: queryKeys.assets.lists(),
        queryFn: api.assets.list,
        staleTime: 60000,
    });
    const handleTrade = (symbol, type) => {
        setOrderSymbol(symbol);
        setOrderType(type);
        setOrderDialogOpen(true);
    };
    return (_jsxs(_Fragment, { children: [_jsx(AppHeader, { title: "Portfolio Ledger", subtitle: "Audited asset balances, average fill prices, and order book transactions", onOpenMobileMenu: onOpenMobileMenu, children: _jsx(PortfolioSelector, {}) }), _jsx("main", { className: "flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto", children: !isLoadingPortfolios && portfolios.length === 0 ? (_jsx(EmptyState, { title: "No Investment Book Initialized", description: "Establish a portfolio book to start purchasing equity shares and auditing performance metrics.", icon: Briefcase, action: {
                        label: 'Create Portfolio',
                        onClick: () => setCreatePortfolioOpen(true),
                    } })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-base font-bold text-text-primary font-mono", children: activePortfolio?.name || 'Selected Portfolio' }), _jsxs("span", { className: "text-[10px] font-mono text-amber border border-amber/30 bg-amber-muted px-1.5 py-0.2 rounded", children: ["BOOK ID #", activePortfolio?.id] })] }), _jsxs("p", { className: "text-[11px] text-text-muted font-mono mt-0.5", children: ["Established ", activePortfolio?.created_at ? new Date(activePortfolio.created_at).toLocaleDateString() : '—', " \u00B7 Real-time P&L Audit"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => {
                                                refetchHoldings();
                                                refetchOrders();
                                            }, disabled: isFetchingHoldings, className: "p-2 text-text-muted hover:text-text-primary rounded border border-border bg-surface hover:bg-surface-elevated transition-colors disabled:opacity-40", title: "Refresh holdings & orders", "aria-label": "Refresh data", children: _jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isFetchingHoldings ? 'animate-spin' : ''}` }) }), _jsxs("button", { onClick: () => handleTrade('AAPL', 'BUY'), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-black bg-amber hover:bg-amber-hover rounded transition-colors shadow-subtle", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Execute Order" })] })] })] }), isHoldingsError && (_jsx(ErrorState, { title: "Holdings Ledger Error", message: holdingsError instanceof Error ? holdingsError.message : 'Failed to retrieve holdings data.', onRetry: () => refetchHoldings() })), _jsx(PortfolioSummary, { holdings: holdings, isLoading: isLoadingHoldings }), _jsx(PortfolioHoldingsTable, { holdings: holdings, isLoading: isLoadingHoldings, onTrade: handleTrade, onOpenOrderDialog: () => handleTrade('AAPL', 'BUY') }), _jsx("div", { className: "pt-2", children: _jsx(OrderHistoryTable, { orders: ordersData?.orders || [], assets: assets, page: ordersPage, limit: ordersLimit, onPageChange: (p) => setOrdersPage(p), isLoading: isLoadingOrders, onOpenOrderDialog: () => handleTrade('AAPL', 'BUY') }) })] })) }), _jsx(ExecuteOrderDialog, { isOpen: orderDialogOpen, onClose: () => setOrderDialogOpen(false), defaultType: orderType, defaultAssetSymbol: orderSymbol }), _jsx(CreatePortfolioDialog, { isOpen: createPortfolioOpen, onClose: () => setCreatePortfolioOpen(false) })] }));
};
