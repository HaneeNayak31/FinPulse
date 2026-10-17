import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, TrendingUp, History, LogOut, Terminal, ShieldCheck, X, } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ConnectionStatus } from './ConnectionStatus';
import { cn } from '../lib/utils';
export const AppSidebar = ({ isOpen = false, onClose }) => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const navItems = [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
        { name: 'Markets', path: '/markets', icon: TrendingUp },
        { name: 'Orders', path: '/orders', icon: History },
    ];
    return (_jsxs(_Fragment, { children: [isOpen && (_jsx("div", { className: "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden", onClick: onClose })), _jsxs("aside", { className: cn('fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar border-r border-border text-text-secondary transition-transform duration-200 ease-in-out lg:static lg:translate-x-0', isOpen ? 'translate-x-0' : '-translate-x-full'), children: [_jsxs("div", { className: "flex items-center justify-between h-16 px-5 border-b border-border bg-surface/30", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex items-center justify-center w-8 h-8 rounded border border-amber/40 bg-amber-muted text-amber", children: _jsx(Terminal, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "font-semibold tracking-wide text-text-primary text-base font-sans", children: "FinPulse" }), _jsx("span", { className: "text-[10px] font-mono tracking-widest text-amber uppercase border border-amber-border px-1 py-0.2 rounded", children: "v1.0" })] }), _jsx("p", { className: "text-[10px] tracking-wider text-text-muted font-mono uppercase", children: theme === 'dark' ? 'Obsidian Terminal' : 'Warm Ledger' })] })] }), onClose && (_jsx("button", { onClick: onClose, className: "p-1 rounded text-text-muted hover:text-text-primary lg:hidden", "aria-label": "Close sidebar", children: _jsx(X, { className: "w-5 h-5" }) }))] }), _jsxs("nav", { className: "flex-1 px-3 py-4 space-y-1 overflow-y-auto", children: [_jsx("div", { className: "px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-text-muted", children: "Workspace" }), navItems.map((item) => {
                                const Icon = item.icon;
                                return (_jsxs(NavLink, { to: item.path, onClick: onClose, className: ({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium tracking-wide transition-colors duration-150', isActive
                                        ? 'bg-surface text-text-primary border-l-2 border-amber font-semibold shadow-subtle'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'), children: [_jsx(Icon, { className: "w-4 h-4 text-text-muted group-hover:text-text-secondary" }), _jsx("span", { children: item.name })] }, item.path));
                            }), _jsx("div", { className: "pt-6 px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-text-muted", children: "Environment" }), _jsxs("div", { className: "px-3 py-2 text-xs text-text-muted flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "w-3.5 h-3.5 text-sage" }), _jsx("span", { className: "text-[11px] font-mono", children: "Simulated Paper Mode" })] })] }), _jsxs("div", { className: "p-3 border-t border-border space-y-3 bg-surface/20", children: [_jsx(ConnectionStatus, {}), _jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-border-subtle", children: [_jsxs("div", { className: "min-w-0 pr-2", children: [_jsx("div", { className: "text-xs font-medium text-text-primary truncate", children: user?.email || 'Authenticated' }), _jsxs("div", { className: "text-[10px] font-mono text-text-muted truncate", children: ["UID #", user?.id || '—'] })] }), _jsx("button", { onClick: logout, className: "p-1.5 rounded text-text-muted hover:text-coral hover:bg-surface-elevated transition-colors", title: "Sign out of FinPulse", "aria-label": "Logout", children: _jsx(LogOut, { className: "w-4 h-4" }) })] })] })] })] }));
};
