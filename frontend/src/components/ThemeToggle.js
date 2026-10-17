import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
export const ThemeToggle = ({ className }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    return (_jsx("button", { type: "button", onClick: toggleTheme, className: cn('relative inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-mono transition-colors duration-150', 'border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary shadow-subtle', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber', className), title: `Switch to ${isDark ? 'Warm Ledger (Light)' : 'Obsidian Terminal (Dark)'} theme`, "aria-label": `Current theme: ${isDark ? 'Obsidian Terminal (Dark)' : 'Warm Ledger (Light)'}. Click to switch theme.`, children: isDark ? (_jsxs(_Fragment, { children: [_jsx(Sun, { className: "w-3.5 h-3.5 text-amber transition-transform duration-200 rotate-0 hover:rotate-45" }), _jsx("span", { className: "hidden sm:inline text-[11px] font-medium tracking-wider", children: "DARK" })] })) : (_jsxs(_Fragment, { children: [_jsx(Moon, { className: "w-3.5 h-3.5 text-amber transition-transform duration-200 rotate-0 hover:-rotate-12" }), _jsx("span", { className: "hidden sm:inline text-[11px] font-medium tracking-wider", children: "LIGHT" })] })) }));
};
