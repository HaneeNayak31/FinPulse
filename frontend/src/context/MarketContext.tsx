import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { ConnectionState, PriceUpdatedEvent } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { BASE_URL } from '../lib/api';

interface PriceTelemetry {
  price: number;
  previousPrice: number | null;
  changeDirection: 'up' | 'down' | 'none';
  updatedAt: string;
}

interface MarketContextType {
  connectionState: ConnectionState;
  livePrices: Record<string, PriceTelemetry>;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  subscribeMany: (symbols: string[]) => void;
  unsubscribeMany: (symbols: string[]) => void;
  reconnect: () => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

// Determine the WebSocket endpoint
function getWebSocketUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (!import.meta.env.DEV && BASE_URL) {
    const apiUrl = new URL(BASE_URL, window.location.origin);
    apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return apiUrl.toString().replace(/\/+$/, '');
  }
  // In development, use Vite's WebSocket proxy.
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>('Connecting');
  const [livePrices, setLivePrices] = useState<Record<string, PriceTelemetry>>({});
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const activeSubscriptionsRef = useRef<Set<string>>(new Set(['AAPL', 'MSFT', 'GOOGL']));
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);

  const sendSubscription = useCallback((type: 'SUBSCRIBE' | 'UNSUBSCRIBE', symbol: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ type, symbol: symbol.toUpperCase() }));
      } catch (err) {
        console.warn(`[FinPulse WS] Failed to send ${type} for ${symbol}`, err);
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (isManuallyClosedRef.current) return;

    if (socketRef.current) {
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        return; // Avoid duplicate connections
      }
      try {
        socketRef.current.close();
      } catch {
        // ignore
      }
    }

    setConnectionState(reconnectAttemptRef.current > 0 ? 'Reconnecting' : 'Connecting');

    const wsUrl = getWebSocketUrl();
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;
    } catch {
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
        const data = JSON.parse(event.data) as PriceUpdatedEvent;
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

            let direction: 'up' | 'down' | 'none' = 'none';
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
          queryClient.setQueryData<any>(['assets'], (oldAssets: any) => {
            if (!Array.isArray(oldAssets)) return oldAssets;
            return oldAssets.map((a: any) =>
              a.symbol === sym ? { ...a, current_price: newPrice } : a
            );
          });
        }
      } catch (err) {
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
    if (isManuallyClosedRef.current) return;

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

  const subscribe = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    activeSubscriptionsRef.current.add(sym);
    sendSubscription('SUBSCRIBE', sym);
  }, [sendSubscription]);

  const unsubscribe = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    activeSubscriptionsRef.current.delete(sym);
    sendSubscription('UNSUBSCRIBE', sym);
  }, [sendSubscription]);

  const subscribeMany = useCallback((symbols: string[]) => {
    symbols.forEach((s) => subscribe(s));
  }, [subscribe]);

  const unsubscribeMany = useCallback((symbols: string[]) => {
    symbols.forEach((s) => unsubscribe(s));
  }, [unsubscribe]);

  return (
    <MarketContext.Provider
      value={{
        connectionState,
        livePrices,
        subscribe,
        unsubscribe,
        subscribeMany,
        unsubscribeMany,
        reconnect,
        isSimulating,
        setIsSimulating,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = (): MarketContextType => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
