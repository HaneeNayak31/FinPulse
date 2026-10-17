import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { formatCurrency, cn } from '../lib/utils';
export const PriceChangeIndicator = ({ price, className, showDirection = false, prefix, }) => {
    const [flash, setFlash] = useState(null);
    const prevPriceRef = useRef(price);
    const timerRef = useRef(null);
    useEffect(() => {
        if (prevPriceRef.current !== price) {
            const isUp = price > prevPriceRef.current;
            setFlash(isUp ? 'up' : 'down');
            prevPriceRef.current = price;
            if (timerRef.current)
                window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
                setFlash(null);
            }, 1200);
        }
        return () => {
            if (timerRef.current)
                window.clearTimeout(timerRef.current);
        };
    }, [price]);
    return (_jsxs("span", { className: cn('inline-flex items-center gap-1 font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors duration-300', flash === 'up' && 'bg-sage-dim text-sage-text ring-1 ring-sage/40', flash === 'down' && 'bg-coral-dim text-coral-text ring-1 ring-coral/40', !flash && 'text-text-primary', className), children: [prefix, formatCurrency(price), showDirection && flash === 'up' && _jsx("span", { className: "text-[10px] text-sage-text", children: "\u25B2" }), showDirection && flash === 'down' && _jsx("span", { className: "text-[10px] text-coral-text", children: "\u25BC" })] }));
};
