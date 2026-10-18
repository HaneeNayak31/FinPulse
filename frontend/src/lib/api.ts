import type {
  User,
  Portfolio,
  Holding,
  HoldingRaw,
  Order,
  OrderRaw,
  Asset,
  AssetRaw,
  OrderType,
} from '../types';

// Determine API base URL.
// When the frontend runs on a dev server (e.g. port 5173), direct requests to port 4000
// are blocked by browser CORS preflight because the Express backend does not include CORS middleware.
// In such environments, we fall back to relative paths so Vite's reverse proxy seamlessly handles them.
function resolveBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined' && envUrl) {
    try {
      const parsed = new URL(envUrl, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        return ''; // Route through Vite dev server proxy
      }
    } catch {
      // ignore
    }
  }
  return envUrl;
}

const BASE_URL = resolveBaseUrl();

const TOKEN_KEY = 'finpulse_auth_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Failed to persist auth token in localStorage', e);
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});

  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.get();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    const netErr = err instanceof Error ? err.message : 'Network connection failure';
    throw new ApiError(0, `Unable to connect to FinPulse backend: ${netErr}`);
  }

  // Handle token expiration/invalid token
  if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('finpulse:auth-expired'));
  }

  const contentType = response.headers.get('content-type') || '';
  let responseData: any = null;

  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    let errorMessage = '';
    if (typeof responseData === 'string' && responseData.trim() && !responseData.trim().startsWith('<')) {
      errorMessage = responseData.trim();
    } else if (responseData && typeof responseData === 'object') {
      errorMessage = responseData.message || responseData.error || '';
    }

    if (!errorMessage) {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        errorMessage = 'FinPulse backend service is currently unreachable (502 Gateway). Ensure the server is running on port 4000.';
      } else if (response.status === 429) {
        errorMessage = 'Too many requests. Please wait a few moments before retrying.';
      } else if (response.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request parameters. Please verify input fields.';
      } else if (response.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }
    }

    throw new ApiError(response.status, errorMessage, responseData);
  }

  return responseData as T;
}

// Helper to normalize numbers safely
function toNum(val: string | number | undefined | null, fallback = 0): number {
  if (val === undefined || val === null) return fallback;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : fallback;
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<{ success: boolean; token: string; message: string }> => {
      const data = await request<{ success: boolean; token: string; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) {
        tokenStorage.set(data.token);
      }
      return data;
    },

    register: async (
      username: string,
      email: string,
      password: string
    ): Promise<{ success: boolean; message: string; user: User }> => {
      return request<{ success: boolean; message: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
    },

    me: async (): Promise<{ user: User }> => {
      return request<{ user: User }>('/auth/me');
    },

    logout: (): void => {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('finpulse:auth-logout'));
    },
  },

  // Portfolios
  portfolios: {
    list: async (): Promise<Portfolio[]> => {
      const res = await request<any>('/portfolios');
      const list = res.portfolios || res.portfolio || [];
      return list.map((p: any) => ({
        id: Number(p.id),
        name: String(p.name),
        user_id: p.user_id ? Number(p.user_id) : undefined,
        created_at: String(p.created_at),
      }));
    },

    create: async (name: string): Promise<Portfolio> => {
      const res = await request<{ success: boolean; message: string; portfolio: any }>('/portfolios', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const p = res.portfolio;
      return {
        id: Number(p.id),
        name: String(p.name),
        user_id: p.user_id ? Number(p.user_id) : undefined,
        created_at: String(p.created_at),
      };
    },

    getById: async (id: number): Promise<Portfolio> => {
      const res = await request<{ portfolio?: any; portfolios?: any }>(`/portfolios/${id}`);
      const p = res.portfolio || res.portfolios;
      return {
        id: Number(p.id),
        name: String(p.name),
        user_id: p.user_id ? Number(p.user_id) : undefined,
        created_at: String(p.created_at),
      };
    },
  },

  // Holdings
  holdings: {
    list: async (portfolioId: number): Promise<Holding[]> => {
      const res = await request<{ success: boolean; holdings: HoldingRaw[] }>(`/portfolios/${portfolioId}/holdings`);
      return (res.holdings || []).map((h) => {
        const qty = toNum(h.quantity);
        const avgPrice = toNum(h.average_price);
        const curPrice = toNum(h.current_price);
        const marketValue = qty * curPrice;
        const costBasis = qty * avgPrice;
        const unrealizedPL = marketValue - costBasis;
        const unrealizedPLPct = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;

        return {
          id: Number(h.id),
          portfolio_id: Number(h.portfolio_id),
          asset_id: Number(h.asset_id),
          symbol: h.symbol,
          name: h.name,
          quantity: qty,
          average_price: avgPrice,
          current_price: curPrice,
          market_value: marketValue,
          cost_basis: costBasis,
          unrealized_pl: unrealizedPL,
          unrealized_pl_percent: unrealizedPLPct,
        };
      });
    },
  },

  // Orders
  orders: {
    list: async (portfolioId: number, page = 1, limit = 20): Promise<{ orders: Order[]; page: number; limit: number }> => {
      const res = await request<{
        success: boolean;
        message: string;
        page: number;
        limit: number;
        orders: OrderRaw[];
      }>(`/portfolios/${portfolioId}/orders?page=${page}&limit=${limit}`);

      const orders = (res.orders || []).map((o) => ({
        id: Number(o.id),
        portfolio_id: Number(o.portfolio_id),
        asset_id: Number(o.asset_id),
        type: o.type,
        quantity: toNum(o.quantity),
        price: toNum(o.price),
        created_at: o.created_at,
      }));

      return {
        orders,
        page: res.page || page,
        limit: res.limit || limit,
      };
    },

    create: async (
      portfolioId: number,
      data: { asset_id: number; type: OrderType; quantity: number }
    ): Promise<Order> => {
      const res = await request<{ success: boolean; message: string; order: OrderRaw }>(
        `/portfolios/${portfolioId}/orders`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const o = res.order;
      return {
        id: Number(o.id),
        portfolio_id: Number(o.portfolio_id),
        asset_id: Number(o.asset_id),
        type: o.type,
        quantity: toNum(o.quantity),
        price: toNum(o.price),
        created_at: o.created_at,
      };
    },
  },

  // Assets
  assets: {
    list: async (): Promise<Asset[]> => {
      const res = await request<{ success: boolean; assets: AssetRaw[] }>('/assets');
      return (res.assets || []).map((a) => ({
        id: Number(a.id),
        symbol: a.symbol,
        name: a.name,
        current_price: toNum(a.current_price),
        created_at: a.created_at,
      }));
    },

    getBySymbol: async (symbol: string): Promise<Asset> => {
      const res = await request<{ success: boolean; asset: AssetRaw }>(`/assets/${symbol.toUpperCase()}`);
      return {
        id: Number(res.asset.id),
        symbol: res.asset.symbol,
        name: res.asset.name,
        current_price: toNum(res.asset.current_price),
      };
    },

    simulateTick: async (symbol: string): Promise<Asset> => {
      const res = await request<{ success: boolean; message: string; asset: AssetRaw }>(
        `/assets/${symbol.toUpperCase()}/simulate`,
        {
          method: 'POST',
        }
      );
      return {
        id: Number(res.asset.id),
        symbol: res.asset.symbol,
        name: res.asset.name,
        current_price: toNum(res.asset.current_price),
      };
    },
  },
};
