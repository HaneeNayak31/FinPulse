import React, { useState } from 'react';
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

interface OutletContextType {
  onOpenMobileMenu: () => void;
}

export const OrdersPage: React.FC = () => {
  const { onOpenMobileMenu } = useOutletContext<OutletContextType>();
  const { activePortfolio } = usePortfolio();

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: queryKeys.orders.list(activePortfolio?.id, page, limit),
    queryFn: () =>
      activePortfolio
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

  return (
    <>
      <AppHeader
        title="Execution Orders"
        subtitle="Chronological transaction audit trail for the selected portfolio"
        onOpenMobileMenu={onOpenMobileMenu}
      >
        <PortfolioSelector />
      </AppHeader>

      <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber" />
              <h2 className="text-sm font-semibold text-text-primary tracking-wide">
                Audited Order Book
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Target Portfolio:{' '}
              <span className="text-text-primary font-medium font-mono">
                {activePortfolio?.name || 'None selected'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 text-text-muted hover:text-text-primary rounded border border-border bg-surface hover:bg-surface-elevated transition-colors"
              title="Refresh order history"
              aria-label="Refresh orders"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOrderDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-black bg-amber hover:bg-amber-hover rounded transition-colors shadow-subtle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Order</span>
            </button>
          </div>
        </div>

        <OrdersTable
          orders={ordersData?.orders || []}
          assets={assets}
          page={page}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage)}
          isLoading={isLoading}
        />
      </main>

      <OrderDialog
        isOpen={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        defaultType="BUY"
        defaultAssetSymbol="AAPL"
      />
    </>
  );
};
