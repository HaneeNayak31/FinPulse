import React from 'react';
import type { Order, Asset } from '../types';
import { formatCurrency, formatNumber, formatDate, cn } from '../lib/utils';
import { History, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Inbox } from 'lucide-react';

interface OrderHistoryTableProps {
  orders: Order[];
  assets?: Asset[];
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
  onOpenOrderDialog?: () => void;
  className?: string;
}

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  orders,
  assets = [],
  page,
  limit,
  onPageChange,
  isLoading,
  onOpenOrderDialog,
  className,
}) => {
  const getSymbol = (assetId: number) => {
    const asset = assets.find((a) => a.id === assetId);
    return asset ? asset.symbol : `Asset #${assetId}`;
  };

  const getAssetName = (assetId: number) => {
    const asset = assets.find((a) => a.id === assetId);
    return asset ? asset.name : '';
  };

  if (isLoading) {
    return (
      <div className={`p-4 rounded-lg bg-surface border border-border ${className || ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-36 bg-surface-elevated rounded animate-pulse" />
          <div className="h-6 w-20 bg-surface-elevated rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-surface-elevated/40 rounded border border-border-subtle animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-surface border border-border shadow-subtle overflow-hidden ${className || ''}`}>
      {/* Table Header & Pagination */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber" />
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-wide">
              Order history
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              Your recent buys and sells
            </p>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[11px] text-text-muted">Page {page}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded border border-border bg-surface-elevated hover:bg-surface text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={orders.length < limit}
              className="p-1 rounded border border-border bg-surface-elevated hover:bg-surface text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-10 h-10 rounded-full border border-border bg-surface-elevated flex items-center justify-center mx-auto text-text-muted mb-3">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-text-primary mb-1">
            No Transactions Recorded
          </p>
          <p className="text-[11px] text-text-muted max-w-xs mx-auto mb-4">
            Trades for this portfolio will appear here with price and time.
          </p>
          {onOpenOrderDialog && (
            <button
              onClick={onOpenOrderDialog}
              className="px-3 py-1.5 text-xs font-mono font-medium text-black bg-amber hover:bg-amber-hover rounded transition-colors"
            >
              Place Order
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated/40 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  <th className="py-3 px-4 font-medium">Order ID</th>
                  <th className="py-3 px-4 font-medium">Side</th>
                  <th className="py-3 px-4 font-medium">Instrument</th>
                  <th className="py-3 px-4 font-medium text-right">Quantity</th>
                  <th className="py-3 px-4 font-medium text-right">Fill Price</th>
                  <th className="py-3 px-4 font-medium text-right">Gross Total</th>
                  <th className="py-3 px-4 font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono">
                {orders.map((o) => {
                  const isBuy = o.type === 'BUY';
                  const total = o.quantity * o.price;
                  const symbol = getSymbol(o.asset_id);
                  const name = getAssetName(o.asset_id);

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-surface-elevated/30 transition-colors duration-150"
                    >
                      <td className="py-3 px-4 text-text-muted text-[11px]">
                        #{o.id}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider',
                            isBuy
                              ? 'bg-sage-dim text-sage-text border-sage/30'
                              : 'bg-coral-dim text-coral-text border-coral/30'
                          )}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {o.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-text-primary text-xs">{symbol}</span>
                        {name && <span className="text-[10px] text-text-muted font-sans ml-1.5 hidden md:inline">({name})</span>}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">
                        {formatNumber(o.quantity, 4)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-text-secondary">
                        {formatCurrency(o.price)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-text-primary font-semibold">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-text-muted text-[11px]">
                        {formatDate(o.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Alternative (Zero horizontal page overflow) */}
          <div className="sm:hidden divide-y divide-border-subtle">
            {orders.map((o) => {
              const isBuy = o.type === 'BUY';
              const total = o.quantity * o.price;
              const symbol = getSymbol(o.asset_id);

              return (
                <div key={o.id} className="p-3.5 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border',
                          isBuy
                            ? 'bg-sage-dim text-sage-text border-sage/30'
                            : 'bg-coral-dim text-coral-text border-coral/30'
                        )}
                      >
                        {o.type}
                      </span>
                      <span className="font-bold text-text-primary">{symbol}</span>
                    </div>
                    <span className="text-text-muted text-[10px]">#{o.id}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      {formatNumber(o.quantity, 4)} @ {formatCurrency(o.price)}
                    </span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {formatCurrency(total)}
                    </span>
                  </div>

                  <div className="text-[10px] text-text-muted/70 text-right">
                    {formatDate(o.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export const OrdersTable = OrderHistoryTable;
