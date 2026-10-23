import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tokenStorage, BASE_URL } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
/**
 * Custom hook to stream portfolio-scoped real-time events via Server-Sent Events (SSE)
 * using fetch + ReadableStream to safely attach the JWT Authorization header
 * without exposing sensitive tokens in URL query strings.
 */
export function usePortfolioEvents({ portfolioId, enabled = true }) {
    const queryClient = useQueryClient();
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);
    const abortControllerRef = useRef(null);
    const connectSSE = useCallback(async () => {
        if (!enabled || !portfolioId || portfolioId <= 0) {
            setIsConnected(false);
            return;
        }
        const token = tokenStorage.get();
        if (!token) {
            setIsConnected(false);
            return;
        }
        // Abort existing stream if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        try {
            const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}/events`, {
                method: 'GET',
                headers: {
                    Accept: 'text/event-stream',
                    Authorization: `Bearer ${token}`,
                },
                signal: controller.signal,
            });
            if (!response.ok || !response.body) {
                setIsConnected(false);
                return;
            }
            setIsConnected(true);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data:')) {
                        const rawData = trimmed.replace(/^data:\s*/, '');
                        if (rawData.startsWith('Connected')) {
                            continue; // Handshake ack
                        }
                        try {
                            const event = JSON.parse(rawData);
                            if (event.event === 'PRICE_UPDATED') {
                                setLastEvent(event);
                                // Invalidate holdings for this portfolio when a price change occurs
                                queryClient.invalidateQueries({
                                    queryKey: queryKeys.holdings.list(portfolioId),
                                });
                            }
                        }
                        catch {
                            // Ignore non-json lines
                        }
                    }
                }
            }
        }
        catch (err) {
            if (err.name !== 'AbortError') {
                console.warn(`[FinPulse SSE] Stream closed for portfolio ${portfolioId}:`, err);
            }
        }
        finally {
            setIsConnected(false);
        }
    }, [enabled, portfolioId, queryClient]);
    useEffect(() => {
        connectSSE();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [connectSSE]);
    return {
        isConnected,
        lastEvent,
        reconnect: connectSSE,
    };
}
