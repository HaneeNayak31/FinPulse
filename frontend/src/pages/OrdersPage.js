import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { usePortfolio } from '../context/PortfolioContext';
import { AppHeader } from '../components/AppHeader';
import { OrdersTable } from '../components/OrdersTable';
import { OrderDialog } from '../components/OrderDialog';
import { PortfolioSelector } from '../components/PortfolioSelector';
import { Plus, History, RefreshCw } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys';
export const OrdersPage = () => {
    const { onOpenMobileMenu } = useOutletContext();
    const { activePortfolio } = usePortfolio();
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 20;
    const { data: ordersData, isLoading, refetch } = useQuery({
        queryKey: queryKeys.orders.list(activePortfolio?.id, page, limit),
        queryFn: () => activePortfolio
            ? api.orders.list(activePortfolio.id, page, limit)
            : Promise.resolve({ orders: [], page: 1, limit }),
        enabled: !!activePortfolio,
        staleTime: 15000,
    });
    const { data: assets = [] } = useQuery({
        queryKey: queryKeys.assets.lists(),
        queryFn: api.assets.list,
        staleTime: 60000,
    });
    return (_jsxs(_Fragment, { children: [_jsx(AppHeader, { title: "Execution Orders", subtitle: "Chronological transaction audit trail for the selected portfolio", onOpenMobileMenu: onOpenMobileMenu, children: _jsx(PortfolioSelector, {}) }), _jsxs("main", { className: "flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(History, { className: "w-4 h-4 text-amber" }), _jsx("h2", { className: "text-sm font-semibold text-text-primary tracking-wide", children: "Audited Order Book" })] }), _jsxs("p", { className: "text-xs text-text-muted mt-0.5", children: ["Target Portfolio:", ' ', _jsx("span", { className: "text-text-primary font-medium font-mono", children: activePortfolio?.name || 'None selected' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => refetch(), className: "p-2 text-text-muted hover:text-text-primary rounded border border-border bg-surface hover:bg-surface-elevated transition-colors", title: "Refresh order history", "aria-label": "Refresh orders", children: _jsx(RefreshCw, { className: "w-3.5 h-3.5" }) }), _jsxs("button", { onClick: () => setOrderDialogOpen(true), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-black bg-amber hover:bg-amber-hover rounded transition-colors shadow-subtle", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "New Order" })] })] })] }), _jsx(OrdersTable, { orders: ordersData?.orders || [], assets: assets, page: page, limit: limit, onPageChange: (newPage) => setPage(newPage), isLoading: isLoading })] }), _jsx(OrderDialog, { isOpen: orderDialogOpen, onClose: () => setOrderDialogOpen(false), defaultType: "BUY", defaultAssetSymbol: "AAPL" })] }));
};
