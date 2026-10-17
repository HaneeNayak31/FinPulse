/**
 * Centralized, type-safe TanStack Query key factories for FinPulse.
 * Ensures consistent cache scoping, prefetching, and targeted invalidation.
 */
export const queryKeys = {
    auth: {
        all: ['auth'],
        user: () => [...queryKeys.auth.all, 'user'],
    },
    portfolios: {
        all: ['portfolios'],
        lists: () => [...queryKeys.portfolios.all, 'list'],
        detail: (id) => [...queryKeys.portfolios.all, 'detail', id],
    },
    holdings: {
        all: ['holdings'],
        list: (portfolioId) => [...queryKeys.holdings.all, 'list', portfolioId],
    },
    orders: {
        all: ['orders'],
        list: (portfolioId, page, limit) => [...queryKeys.orders.all, 'list', portfolioId, page ?? 1, limit ?? 20],
    },
    assets: {
        all: ['assets'],
        lists: () => [...queryKeys.assets.all, 'list'],
        detail: (symbol) => [...queryKeys.assets.all, 'detail', symbol.toUpperCase()],
    },
};
