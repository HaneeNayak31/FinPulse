import React, { useState } from 'react';
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
import type { OrderType } from '../types';
import { Plus, RefreshCw, Briefcase } from 'lucide-react';

import { queryKeys } from '../lib/queryKeys';

interface OutletContextType {
  onOpenMobileMenu: () => void;
}

export const PortfolioPage: React.FC = () => {
  const { onOpenMobileMenu } = useOutletContext<OutletContextType>();
  const { activePortfolio, portfolios, isLoading: isLoadingPortfolios } = usePortfolio();

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('BUY');
  const [orderSymbol, setOrderSymbol] = useState<string>('AAPL');
  const [createPortfolioOpen, setCreatePortfolioOpen] = useState(false);
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const ordersLimit = 10;

  // Holdings query
  const {
    data: holdings = [],
    isLoading: isLoadingHoldings,
    isError: isHoldingsError,
    error: holdingsError,
    refetch: refetchHoldings,
    isFetching: isFetchingHoldings,
  } = useQuery({
    queryKey: queryKeys.holdings.list(activePortfolio?.id),
    queryFn: () => (activePortfolio ? api.holdings.list(activePortfolio.id) : Promise.resolve([])),
    enabled: !!activePortfolio,
    staleTime: 10000,
  });

  // Orders query with pagination
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: queryKeys.orders.list(activePortfolio?.id, ordersPage, ordersLimit),
    queryFn: () =>
      activePortfolio
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

  const handleTrade = (symbol: string, type: OrderType) => {
    setOrderSymbol(symbol);
    setOrderType(type);
    setOrderDialogOpen(true);
  };

  return (
    <>
      <AppHeader
        title="Portfolio"
        subtitle="Holdings, performance, and orders"
        onOpenMobileMenu={onOpenMobileMenu}
      >
        <PortfolioSelector />
      </AppHeader>

      <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {!isLoadingPortfolios && portfolios.length === 0 ? (
          <EmptyState
            title="Create your first portfolio"
            description="Start tracking positions and performance with a paper-trading portfolio."
            icon={Briefcase}
            action={{
              label: 'Create portfolio',
              onClick: () => setCreatePortfolioOpen(true),
            }}
          />
        ) : (
          <>
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-text-primary font-mono">
                    {activePortfolio?.name || 'Selected Portfolio'}
                  </h2>
                  <span className="text-[10px] font-mono text-amber border border-amber/30 bg-amber-muted px-1.5 py-0.2 rounded">
                    Portfolio #{activePortfolio?.id}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted font-mono mt-0.5">
                  Created {activePortfolio?.created_at ? new Date(activePortfolio.created_at).toLocaleDateString() : '—'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    refetchHoldings();
                    refetchOrders();
                  }}
                  disabled={isFetchingHoldings}
                  className="p-2 text-text-muted hover:text-text-primary rounded border border-border bg-surface hover:bg-surface-elevated transition-colors disabled:opacity-40"
                  title="Refresh holdings & orders"
                  aria-label="Refresh data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingHoldings ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => handleTrade('AAPL', 'BUY')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-black bg-amber hover:bg-amber-hover rounded transition-colors shadow-subtle"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Place trade</span>
                </button>
              </div>
            </div>

            {/* Error handling */}
            {isHoldingsError && (
              <ErrorState
                title="Holdings Ledger Error"
                message={holdingsError instanceof Error ? holdingsError.message : 'Failed to retrieve holdings data.'}
                onRetry={() => refetchHoldings()}
              />
            )}

            {/* Summary Metrics */}
            <PortfolioSummary holdings={holdings} isLoading={isLoadingHoldings} />

            {/* Holdings Table */}
            <PortfolioHoldingsTable
              holdings={holdings}
              isLoading={isLoadingHoldings}
              onTrade={handleTrade}
              onOpenOrderDialog={() => handleTrade('AAPL', 'BUY')}
            />

            {/* Orders Table with Pagination */}
            <div className="pt-2">
              <OrderHistoryTable
                orders={ordersData?.orders || []}
                assets={assets}
                page={ordersPage}
                limit={ordersLimit}
                onPageChange={(p) => setOrdersPage(p)}
                isLoading={isLoadingOrders}
                onOpenOrderDialog={() => handleTrade('AAPL', 'BUY')}
              />
            </div>
          </>
        )}
      </main>

      <ExecuteOrderDialog
        isOpen={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        defaultType={orderType}
        defaultAssetSymbol={orderSymbol}
      />

      <CreatePortfolioDialog
        isOpen={createPortfolioOpen}
        onClose={() => setCreatePortfolioOpen(false)}
      />
    </>
  );
};
