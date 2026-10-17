import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useMarket } from '../context/MarketContext';
import { usePortfolio } from '../context/PortfolioContext';
import type { OrderType, Asset } from '../types';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { queryKeys } from '../lib/queryKeys';
import {
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Receipt,
} from 'lucide-react';

interface ExecuteOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: OrderType;
  defaultAssetSymbol?: string;
}

export const ExecuteOrderDialog: React.FC<ExecuteOrderDialogProps> = ({
  isOpen,
  onClose,
  defaultType = 'BUY',
  defaultAssetSymbol = 'AAPL',
}) => {
  const queryClient = useQueryClient();
  const { activePortfolio } = usePortfolio();
  const { livePrices } = useMarket();

  const [orderType, setOrderType] = useState<OrderType>(defaultType);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultAssetSymbol);
  const [quantityStr, setQuantityStr] = useState<string>('1');
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      if (!activePortfolio) throw new Error('No active portfolio selected');
      if (!selectedAsset) throw new Error('No asset selected');
      if (isInvalidQuantity) throw new Error('Quantity must be greater than zero');
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
      setSuccessMessage(
        `Executed ${newOrder.type} for ${newOrder.quantity} ${selectedSymbol} @ ${formatCurrency(newOrder.price)} (Total: ${formatCurrency(Number(newOrder.quantity) * Number(newOrder.price))})`
      );

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

  if (!isOpen) return null;

  const handleMaxClick = () => {
    if (availableShares > 0) {
      setQuantityStr(String(availableShares));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg p-6 bg-surface border border-border rounded-lg shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={orderMutation.isPending}
          className="absolute top-4 right-4 p-1 rounded text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          aria-label="Close order dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dialog Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber" />
              <h2 className="text-base font-semibold text-text-primary tracking-wide">
                Terminal Order Execution
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Portfolio Book:{' '}
              <span className="text-text-primary font-medium font-mono">
                {activePortfolio?.name || 'Primary'}
              </span>
            </p>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-amber border border-amber/30 bg-amber-muted px-2 py-0.5 rounded">
            SIMULATED
          </span>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3 mb-4 rounded text-xs bg-sage-dim border border-sage/30 text-sage-text flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="font-mono">{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 mb-4 rounded text-xs bg-coral-dim border border-coral/30 text-coral-text flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!isReviewMode ? (
          /* Step 1: Order Input */
          <div className="space-y-4">
            {/* BUY / SELL Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-elevated rounded border border-border-subtle">
              <button
                type="button"
                onClick={() => setOrderType('BUY')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 text-xs font-mono font-medium rounded transition-all',
                  orderType === 'BUY'
                    ? 'bg-sage-dim text-sage-text border border-sage/40 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>BUY ORDER</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('SELL')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 text-xs font-mono font-medium rounded transition-all',
                  orderType === 'SELL'
                    ? 'bg-coral-dim text-coral-text border border-coral/40 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>SELL ORDER</span>
              </button>
            </div>

            {/* Asset Selection */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5">
                Instrument
              </label>
              {isLoadingAssets ? (
                <div className="h-10 bg-surface-elevated rounded animate-pulse" />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {assets.map((asset) => {
                    const isSelected = asset.symbol === selectedSymbol;
                    const live = livePrices[asset.symbol]?.price ?? asset.current_price;
                    return (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => setSelectedSymbol(asset.symbol)}
                        className={cn(
                          'p-2.5 rounded border text-left transition-all',
                          isSelected
                            ? 'border-amber bg-surface-elevated text-text-primary'
                            : 'border-border bg-surface hover:border-border-strong text-text-secondary'
                        )}
                      >
                        <div className="font-mono font-bold text-xs text-text-primary">
                          {asset.symbol}
                        </div>
                        <div className="text-[10px] text-text-muted truncate mb-1">
                          {asset.name}
                        </div>
                        <div className="font-mono text-xs tabular-nums text-amber">
                          {formatCurrency(live)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price & Balance Telemetry */}
            <div className="p-3 rounded bg-surface-elevated/70 border border-border-subtle grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-mono uppercase text-text-muted">Market Quote</div>
                <div className="font-mono text-sm font-semibold text-text-primary mt-0.5">
                  {formatCurrency(activePrice)}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">Live streaming rate</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-text-muted">Owned Balance</div>
                <div className="font-mono text-sm font-semibold text-text-primary mt-0.5">
                  {formatNumber(availableShares, 4)} shares
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  {isSell && availableShares === 0 ? 'No shares to sell' : 'Available in book'}
                </div>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="dialog-quantity"
                  className="block text-xs font-mono uppercase tracking-wider text-text-muted"
                >
                  Order Quantity (Shares)
                </label>
                {isSell && availableShares > 0 && (
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="text-[10px] font-mono text-amber hover:underline uppercase"
                  >
                    Sell Max ({formatNumber(availableShares, 2)})
                  </button>
                )}
              </div>
              <input
                id="dialog-quantity"
                type="number"
                min="0.0001"
                step="any"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                placeholder="1"
                className={cn(
                  'w-full px-3 py-2 text-sm font-mono bg-surface-elevated border rounded text-text-primary focus:outline-none transition-colors',
                  hasInsufficientShares ? 'border-coral' : 'border-border focus:border-amber'
                )}
                disabled={orderMutation.isPending}
              />
              {hasInsufficientShares && (
                <p className="text-[11px] text-coral-text mt-1 flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3 h-3" />
                  Cannot sell more shares than currently owned ({formatNumber(availableShares, 4)}).
                </p>
              )}
            </div>

            {/* Estimated Total */}
            <div className="flex items-center justify-between p-3 rounded bg-surface-elevated border border-border-subtle font-mono text-xs">
              <span className="text-text-muted uppercase">Estimated Gross Value:</span>
              <span className="text-base font-bold text-text-primary tabular-nums">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded border border-transparent hover:border-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isInvalidQuantity || hasInsufficientShares || !activePortfolio}
                onClick={() => setIsReviewMode(true)}
                className={cn(
                  'px-4 py-2 text-xs font-mono font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  orderType === 'BUY'
                    ? 'bg-sage text-black hover:bg-sage/90'
                    : 'bg-coral text-black hover:bg-coral/90'
                )}
              >
                Review {orderType} Order
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Concise Order Review */
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-lg bg-surface-elevated border border-border-subtle space-y-3 font-mono text-xs">
              <div className="text-[10px] uppercase text-text-muted tracking-wider border-b border-border-subtle pb-2">
                Order Review & Authorization
              </div>

              <div className="flex justify-between py-1 border-b border-border-subtle/50">
                <span className="text-text-muted">Transaction Type</span>
                <span
                  className={cn(
                    'font-bold px-1.5 py-0.2 rounded text-[11px]',
                    orderType === 'BUY' ? 'bg-sage-dim text-sage-text' : 'bg-coral-dim text-coral-text'
                  )}
                >
                  {orderType}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border-subtle/50">
                <span className="text-text-muted">Instrument</span>
                <span className="text-text-primary font-bold">{selectedSymbol} ({selectedAsset?.name})</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border-subtle/50">
                <span className="text-text-muted">Execution Quantity</span>
                <span className="text-text-primary font-bold tabular-nums">{formatNumber(quantity, 4)} Shares</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border-subtle/50">
                <span className="text-text-muted">Estimated Unit Price</span>
                <span className="text-text-primary tabular-nums">{formatCurrency(activePrice)}</span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-text-secondary uppercase">Gross Consideration</span>
                <span className="text-base font-bold text-amber tabular-nums">{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>

            <p className="text-[11px] text-text-muted font-mono leading-relaxed">
              Execution is recorded atomically into PostgreSQL ledger. Price is locked at server execution timestamp.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setIsReviewMode(false)}
                disabled={orderMutation.isPending}
                className="px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded border border-transparent hover:border-border transition-colors disabled:opacity-50"
              >
                Back to Edit
              </button>

              <button
                type="button"
                disabled={orderMutation.isPending}
                onClick={() => orderMutation.mutate()}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  orderType === 'BUY'
                    ? 'bg-sage text-black hover:bg-sage/90'
                    : 'bg-coral text-black hover:bg-coral/90'
                )}
              >
                {orderMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {orderMutation.isPending
                    ? 'Submitting to Ledger...'
                    : `Confirm & Execute ${orderType}`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const OrderDialog = ExecuteOrderDialog;
