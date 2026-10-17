import React, { useState } from 'react';
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
import type { OrderType } from '../types';
import { Plus, ArrowRight, Briefcase } from 'lucide-react';

import { queryKeys } from '../lib/queryKeys';

interface OutletContextType {
  onOpenMobileMenu: () => void;
}

export const DashboardPage: React.FC = () => {
  const { onOpenMobileMenu } = useOutletContext<OutletContextType>();
  const { activePortfolio, portfolios, isLoading: isLoadingPortfolios } = usePortfolio();

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('BUY');
  const [orderSymbol, setOrderSymbol] = useState<string>('AAPL');
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
    queryFn: () =>
      activePortfolio
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

  const handleTradeAsset = (symbol: string, type: OrderType) => {
    setOrderSymbol(symbol);
    setOrderType(type);
    setOrderDialogOpen(true);
  };

  return (
    <>
      <AppHeader
        title="Terminal Overview"
        subtitle="Real-time equity valuation, position distribution, and live asset surveillance"
        onOpenMobileMenu={onOpenMobileMenu}
      >
        <PortfolioSelector />
      </AppHeader>

      <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* If user has no portfolio books established yet */}
        {!isLoadingPortfolios && portfolios.length === 0 ? (
          <EmptyState
            title="No Investment Book Initialized"
            description="To begin monitoring equity instruments, tracking real-time unrealized P&L, and executing simulated paper orders, create your first portfolio book."
            icon={Briefcase}
            action={{
              label: 'Initialize First Portfolio Book',
              onClick: () => setCreatePortfolioOpen(true),
            }}
          />
        ) : (
          <>
            {/* Portfolio Context Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border-subtle">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-sans font-bold text-text-primary tracking-tight">
                    {activePortfolio?.name || 'Investment Portfolio'}
                  </h1>
                  <span className="text-[10px] font-mono text-text-muted border border-border bg-surface px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Paper Trading · USD
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1 font-sans">
                  Real-time portfolio evaluation, asset weight distribution, and market order execution.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  to="/portfolio"
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-mono font-medium text-text-secondary hover:text-text-primary bg-surface border border-border hover:border-border-strong hover:bg-surface-elevated rounded transition-colors shadow-subtle"
                >
                  <span>Holdings Ledger</span>
                  <ArrowRight className="w-3 h-3 text-text-muted" />
                </Link>
                <button
                  onClick={() => handleTradeAsset('AAPL', 'BUY')}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-mono font-bold text-black bg-amber hover:bg-amber-hover rounded transition-colors shadow-subtle"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Execute Order</span>
                </button>
              </div>
            </div>

            {/* Consistent Summary Row (4 metric cards) */}
            <PortfolioSummary holdings={holdings} isLoading={isLoadingHoldings} />

            {/* Balanced 2-Column Responsive Grid: Watchlist (Left) + Portfolio Allocation (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Market Surveillance Watchlist (7 cols on lg) */}
              <div className="lg:col-span-7 flex">
                <MarketWatchlist
                  onSelectAssetForOrder={handleTradeAsset}
                  className="w-full"
                />
              </div>

              {/* Portfolio Holdings Allocation Donut (5 cols on lg) */}
              <div className="lg:col-span-5 flex">
                <PortfolioAllocation
                  holdings={holdings}
                  isLoading={isLoadingHoldings}
                  onOpenOrderDialog={() => handleTradeAsset('AAPL', 'BUY')}
                  className="w-full"
                />
              </div>
            </div>

            {/* Recent Order Ledger Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-text-muted">
                  Recent Ledger Activity
                </span>
                <Link
                  to="/orders"
                  className="text-xs font-mono text-amber hover:underline flex items-center gap-1"
                >
                  <span>Full Order Audit Trail</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <OrderHistoryTable
                orders={ordersData?.orders || []}
                assets={assets}
                page={1}
                limit={5}
                onPageChange={() => {}}
                isLoading={isLoadingOrders}
                onOpenOrderDialog={() => handleTradeAsset('AAPL', 'BUY')}
              />
            </div>
          </>
        )}
      </main>

      {/* Execute Order Modal */}
      <ExecuteOrderDialog
        isOpen={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        defaultType={orderType}
        defaultAssetSymbol={orderSymbol}
      />

      {/* Create Portfolio Modal */}
      <CreatePortfolioDialog
        isOpen={createPortfolioOpen}
        onClose={() => setCreatePortfolioOpen(false)}
      />
    </>
  );
};
