/**
 * Centralized, type-safe TanStack Query key factories for FinPulse.
 * Ensures consistent cache scoping, prefetching, and targeted invalidation.
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  portfolios: {
    all: ['portfolios'] as const,
    lists: () => [...queryKeys.portfolios.all, 'list'] as const,
    detail: (id: number | null | undefined) => [...queryKeys.portfolios.all, 'detail', id] as const,
  },
  holdings: {
    all: ['holdings'] as const,
    list: (portfolioId: number | null | undefined) =>
      [...queryKeys.holdings.all, 'list', portfolioId] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (
      portfolioId: number | null | undefined,
      page?: number,
      limit?: number
    ) => [...queryKeys.orders.all, 'list', portfolioId, page ?? 1, limit ?? 20] as const,
  },
  assets: {
    all: ['assets'] as const,
    lists: () => [...queryKeys.assets.all, 'list'] as const,
    detail: (symbol: string) => [...queryKeys.assets.all, 'detail', symbol.toUpperCase()] as const,
  },
};
