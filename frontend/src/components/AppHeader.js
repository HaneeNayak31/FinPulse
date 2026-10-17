import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Menu, Zap } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../lib/api';
import { useMarket } from '../context/MarketContext';
export const AppHeader = ({ title, subtitle, onOpenMobileMenu, children, }) => {
    const { isSimulating, setIsSimulating } = useMarket();
    const [simFeedback, setSimFeedback] = useState(null);
    const handleSimulateTick = async (symbol) => {
        try {
            setIsSimulating(true);
            const res = await api.assets.simulateTick(symbol);
            setSimFeedback(`${symbol} → $${Number(res.current_price).toFixed(2)}`);
            setTimeout(() => setSimFeedback(null), 2500);
        }
        catch (err) {
            console.error('Failed to trigger simulation tick', err);
        }
        finally {
            setIsSimulating(false);
        }
    };
    return (_jsx("header", { className: "sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md", children: _jsxs("div", { className: "flex items-center justify-between h-16 px-4 md:px-8 max-w-7xl w-full mx-auto", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [onOpenMobileMenu && (_jsx("button", { onClick: onOpenMobileMenu, className: "p-1.5 -ml-1 text-text-muted hover:text-text-primary rounded-md hover:bg-surface transition-colors lg:hidden", "aria-label": "Open navigation menu", children: _jsx(Menu, { className: "w-5 h-5" }) })), _jsxs("div", { className: "min-w-0", children: [_jsx("h1", { className: "text-sm md:text-base font-semibold text-text-primary tracking-tight truncate", children: title }), subtitle && (_jsx("p", { className: "text-[11px] text-text-muted hidden sm:block tracking-normal truncate", children: subtitle }))] })] }), _jsxs("div", { className: "flex items-center gap-2 sm:gap-3 flex-shrink-0", children: [children, _jsxs("div", { className: "hidden xl:flex items-center gap-1.5 h-8 border border-border-subtle bg-surface px-2.5 rounded-md text-xs shadow-subtle", children: [_jsxs("span", { className: "text-[11px] text-text-muted font-mono flex items-center gap-1", children: [_jsx(Zap, { className: "w-3 h-3 text-amber" }), "Tick Sim:"] }), ['AAPL', 'MSFT', 'GOOGL'].map((sym) => (_jsx("button", { disabled: isSimulating, onClick: () => handleSimulateTick(sym), className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-text-secondary hover:text-amber hover:bg-surface-elevated transition-colors disabled:opacity-50", title: `Simulate real server-side market tick for ${sym}`, children: sym }, sym))), simFeedback && (_jsx("span", { className: "ml-1 text-[10px] font-mono text-sage-text animate-fade-in font-medium", children: simFeedback }))] }), _jsx("div", { className: "hidden sm:block h-4 w-px bg-border" }), _jsx(ConnectionStatus, { compact: true }), _jsx(ThemeToggle, {})] })] }) }));
};
