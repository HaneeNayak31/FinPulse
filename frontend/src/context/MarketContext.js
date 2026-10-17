import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
const MarketContext = createContext(undefined);
// Determine the WebSocket endpoint
function getWebSocketUrl() {
    const envUrl = import.meta.env.VITE_WS_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
        return envUrl.trim();
    }
    // Default to Vite dev server ws proxy or same host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
}
export const MarketProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [connectionState, setConnectionState] = useState('Connecting');
    const [livePrices, setLivePrices] = useState({});
    const [isSimulating, setIsSimulating] = useState(false);
    const socketRef = useRef(null);
    const activeSubscriptionsRef = useRef(new Set(['AAPL', 'MSFT', 'GOOGL']));
    const reconnectAttemptRef = useRef(0);
    const reconnectTimerRef = useRef(null);
    const isManuallyClosedRef = useRef(false);
    const sendSubscription = useCallback((type, symbol) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            try {
                socketRef.current.send(JSON.stringify({ type, symbol: symbol.toUpperCase() }));
            }
            catch (err) {
                console.warn(`[FinPulse WS] Failed to send ${type} for ${symbol}`, err);
            }
        }
    }, []);
    const connect = useCallback(() => {
        if (isManuallyClosedRef.current)
            return;
        if (socketRef.current) {
            if (socketRef.current.readyState === WebSocket.OPEN ||
                socketRef.current.readyState === WebSocket.CONNECTING) {
                return; // Avoid duplicate connections
            }
            try {
                socketRef.current.close();
            }
            catch {
                // ignore
            }
        }
        setConnectionState(reconnectAttemptRef.current > 0 ? 'Reconnecting' : 'Connecting');
        const wsUrl = getWebSocketUrl();
        let ws;
        try {
            ws = new WebSocket(wsUrl);
            socketRef.current = ws;
        }
        catch {
            setConnectionState('Disconnected');
            scheduleReconnect();
            return;
        }
        ws.onopen = () => {
            setConnectionState('Connected');
            const wasReconnecting = reconnectAttemptRef.current > 0;
            reconnectAttemptRef.current = 0;
            // Resubscribe to all active symbols
            activeSubscriptionsRef.current.forEach((symbol) => {
                sendSubscription('SUBSCRIBE', symbol);
            });
            // If recovering from a disconnect, refetch REST prices immediately to guarantee no missed ticks
            if (wasReconnecting) {
                queryClient.invalidateQueries({ queryKey: ['assets'] });
                queryClient.invalidateQueries({ queryKey: ['holdings'] });
            }
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'PRICE_UPDATED' && data.symbol) {
                    const sym = data.symbol.toUpperCase();
                    const newPrice = typeof data.price === 'string' ? parseFloat(data.price) : Number(data.price);
                    const eventTimestamp = data.timestamp || new Date().toISOString();
                    setLivePrices((prev) => {
                        const current = prev[sym];
                        // Monotonic protection: If incoming event timestamp is older than current data, discard it
                        if (current?.updatedAt && new Date(eventTimestamp).getTime() < new Date(current.updatedAt).getTime()) {
                            return prev;
                        }
                        let direction = 'none';
                        if (current && current.price !== newPrice) {
                            direction = newPrice > current.price ? 'up' : 'down';
                        }
                        return {
                            ...prev,
                            [sym]: {
                                price: newPrice,
                                previousPrice: current?.price ?? null,
                                changeDirection: direction,
                                updatedAt: eventTimestamp,
                            },
                        };
                    });
                    // Optimistically update TanStack Query cache directly in memory without firing a full REST refetch
                    queryClient.setQueryData(['assets'], (oldAssets) => {
                        if (!Array.isArray(oldAssets))
                            return oldAssets;
                        return oldAssets.map((a) => a.symbol === sym ? { ...a, current_price: newPrice } : a);
                    });
                }
            }
            catch (err) {
                console.warn('[FinPulse WS] Message parse error:', err);
            }
        };
        ws.onerror = () => {
            // Browser ws error event doesn't contain detailed info for security
            // ws.onclose will trigger next to schedule reconnection
        };
        ws.onclose = () => {
            socketRef.current = null;
            if (!isManuallyClosedRef.current) {
                setConnectionState('Disconnected');
                scheduleReconnect();
            }
        };
    }, [sendSubscription, queryClient]);
    const scheduleReconnect = useCallback(() => {
        if (isManuallyClosedRef.current)
            return;
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
        }
        // Exponential backoff capped at 15s with random jitter
        const attempt = reconnectAttemptRef.current + 1;
        reconnectAttemptRef.current = attempt;
        const baseDelay = Math.min(1000 * Math.pow(1.5, attempt), 15000);
        const jitter = Math.random() * 800;
        const delay = Math.round(baseDelay + jitter);
        setConnectionState('Reconnecting');
        reconnectTimerRef.current = window.setTimeout(() => {
            connect();
        }, delay);
    }, [connect]);
    const reconnect = useCallback(() => {
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
        }
        reconnectAttemptRef.current = 0;
        connect();
    }, [connect]);
    useEffect(() => {
        isManuallyClosedRef.current = false;
        connect();
        return () => {
            isManuallyClosedRef.current = true;
            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [connect]);
    const subscribe = useCallback((symbol) => {
        const sym = symbol.toUpperCase();
        activeSubscriptionsRef.current.add(sym);
        sendSubscription('SUBSCRIBE', sym);
    }, [sendSubscription]);
    const unsubscribe = useCallback((symbol) => {
        const sym = symbol.toUpperCase();
        activeSubscriptionsRef.current.delete(sym);
        sendSubscription('UNSUBSCRIBE', sym);
    }, [sendSubscription]);
    const subscribeMany = useCallback((symbols) => {
        symbols.forEach((s) => subscribe(s));
    }, [subscribe]);
    const unsubscribeMany = useCallback((symbols) => {
        symbols.forEach((s) => unsubscribe(s));
    }, [unsubscribe]);
    return (_jsx(MarketContext.Provider, { value: {
            connectionState,
            livePrices,
            subscribe,
            unsubscribe,
            subscribeMany,
            unsubscribeMany,
            reconnect,
            isSimulating,
            setIsSimulating,
        }, children: children }));
};
export const useMarket = () => {
    const context = useContext(MarketContext);
    if (!context) {
        throw new Error('useMarket must be used within a MarketProvider');
    }
    return context;
};
