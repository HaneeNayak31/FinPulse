// Determine API base URL.
// When the frontend runs on a dev server (e.g. port 5173), direct requests to port 4000
// are blocked by browser CORS preflight because the Express backend does not include CORS middleware.
// In such environments, we fall back to relative paths so Vite's reverse proxy seamlessly handles them.
function resolveBaseUrl() {
    const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined' && envUrl) {
        try {
            const parsed = new URL(envUrl, window.location.origin);
            if (parsed.origin !== window.location.origin) {
                return ''; // Route through Vite dev server proxy
            }
        }
        catch {
            // ignore
        }
    }
    return envUrl;
}
const BASE_URL = resolveBaseUrl();
const TOKEN_KEY = 'finpulse_auth_token';
export const tokenStorage = {
    get: () => {
        try {
            return localStorage.getItem(TOKEN_KEY);
        }
        catch {
            return null;
        }
    },
    set: (token) => {
        try {
            localStorage.setItem(TOKEN_KEY, token);
        }
        catch (e) {
            console.warn('Failed to persist auth token in localStorage', e);
        }
    },
    clear: () => {
        try {
            localStorage.removeItem(TOKEN_KEY);
        }
        catch {
            // ignore
        }
    },
};
export class ApiError extends Error {
    status;
    data;
    constructor(status, message, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}
async function request(path, options = {}) {
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
    let response;
    try {
        response = await fetch(url, { ...options, headers });
    }
    catch (err) {
        const netErr = err instanceof Error ? err.message : 'Network connection failure';
        throw new ApiError(0, `Unable to connect to FinPulse backend: ${netErr}`);
    }
    // Handle token expiration/invalid token
    if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent('finpulse:auth-expired'));
    }
    const contentType = response.headers.get('content-type') || '';
    let responseData = null;
    if (contentType.includes('application/json')) {
        try {
            responseData = await response.json();
        }
        catch {
            responseData = null;
        }
    }
    else {
        try {
            responseData = await response.text();
        }
        catch {
            responseData = null;
        }
    }
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        if (typeof responseData === 'string' && responseData.trim()) {
            errorMessage = responseData;
        }
        else if (responseData && typeof responseData === 'object') {
            errorMessage = responseData.message || responseData.error || errorMessage;
        }
        throw new ApiError(response.status, errorMessage, responseData);
    }
    return responseData;
}
// Helper to normalize numbers safely
function toNum(val, fallback = 0) {
    if (val === undefined || val === null)
        return fallback;
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : fallback;
}
export const api = {
    // Auth
    auth: {
        login: async (email, password) => {
            const data = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (data.token) {
                tokenStorage.set(data.token);
            }
            return data;
        },
        register: async (username, email, password) => {
            return request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password }),
            });
        },
        me: async () => {
            return request('/auth/me');
        },
        logout: () => {
            tokenStorage.clear();
            window.dispatchEvent(new CustomEvent('finpulse:auth-logout'));
        },
    },
    // Portfolios
    portfolios: {
        list: async () => {
            const res = await request('/portfolios');
            const list = res.portfolios || res.portfolio || [];
            return list.map((p) => ({
                id: Number(p.id),
                name: String(p.name),
                user_id: p.user_id ? Number(p.user_id) : undefined,
                created_at: String(p.created_at),
            }));
        },
        create: async (name) => {
            const res = await request('/portfolios', {
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
        getById: async (id) => {
            const res = await request(`/portfolios/${id}`);
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
        list: async (portfolioId) => {
            const res = await request(`/portfolios/${portfolioId}/holdings`);
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
        list: async (portfolioId, page = 1, limit = 20) => {
            const res = await request(`/portfolios/${portfolioId}/orders?page=${page}&limit=${limit}`);
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
        create: async (portfolioId, data) => {
            const res = await request(`/portfolios/${portfolioId}/orders`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
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
        list: async () => {
            const res = await request('/assets');
            return (res.assets || []).map((a) => ({
                id: Number(a.id),
                symbol: a.symbol,
                name: a.name,
                current_price: toNum(a.current_price),
                created_at: a.created_at,
            }));
        },
        getBySymbol: async (symbol) => {
            const res = await request(`/assets/${symbol.toUpperCase()}`);
            return {
                id: Number(res.asset.id),
                symbol: res.asset.symbol,
                name: res.asset.name,
                current_price: toNum(res.asset.current_price),
            };
        },
        simulateTick: async (symbol) => {
            const res = await request(`/assets/${symbol.toUpperCase()}/simulate`, {
                method: 'POST',
            });
            return {
                id: Number(res.asset.id),
                symbol: res.asset.symbol,
                name: res.asset.name,
                current_price: toNum(res.asset.current_price),
            };
        },
    },
};
