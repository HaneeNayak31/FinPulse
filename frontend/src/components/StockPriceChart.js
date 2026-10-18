import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { useTheme } from '../context/ThemeContext';
const MAX_POINTS = 24;
export const StockPriceChart = ({ symbol, price, liveData }) => {
    const { theme } = useTheme();
    const [points, setPoints] = useState([{ time: 'Now', price }]);
    useEffect(() => {
        if (!Number.isFinite(price))
            return;
        setPoints((current) => {
            const last = current[current.length - 1];
            if (last && last.price === price)
                return current;
            return [
                ...current,
                {
                    time: liveData?.updatedAt
                        ? new Date(liveData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Now',
                    price,
                },
            ].slice(-MAX_POINTS);
        });
    }, [price, liveData?.updatedAt]);
    const isPositive = points.length > 1 && points[points.length - 1].price >= points[0].price;
    const color = isPositive ? 'var(--color-positive)' : 'var(--color-negative)';
    const gradientId = `stock-gradient-${symbol}`;
    const isDark = theme === 'dark';
    return (_jsx("div", { className: "h-20 w-full", "aria-label": `${symbol} price trend`, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: points, margin: { top: 8, right: 0, bottom: 0, left: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: gradientId, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: 0.28 }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: 0 })] }) }), _jsx(XAxis, { dataKey: "time", hide: true }), _jsx(YAxis, { domain: ['dataMin', 'dataMax'], hide: true }), _jsx(Tooltip, { cursor: { stroke: isDark ? '#3E4037' : '#C8C2B7', strokeWidth: 1 }, formatter: (value) => [`$${Number(value).toFixed(2)}`, 'Price'], labelFormatter: () => symbol, contentStyle: {
                            backgroundColor: isDark ? '#20211D' : '#FFFFFF',
                            borderColor: isDark ? '#2D2E28' : '#E4DED2',
                            borderRadius: 6,
                            fontSize: 11,
                        } }), _jsx(Area, { type: "monotone", dataKey: "price", stroke: color, strokeWidth: 2, fill: `url(#${gradientId})`, isAnimationActive: false })] }) }) }));
};
export default StockPriceChart;
