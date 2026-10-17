import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { CreatePortfolioDialog } from './CreatePortfolioDialog';
import { Briefcase, ChevronDown, Plus, Check } from 'lucide-react';
import { cn } from '../lib/utils';
export const PortfolioSelector = ({ className }) => {
    const { portfolios, activePortfolio, setActivePortfolioId, isLoading } = usePortfolio();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const containerRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    if (isLoading) {
        return (_jsx("div", { className: "h-8 w-36 rounded bg-surface-elevated animate-pulse" }));
    }
    if (portfolios.length === 0) {
        return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => setCreateDialogOpen(true), className: "flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-amber bg-amber-muted border border-amber/40 hover:border-amber transition-colors", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "New Portfolio" })] }), _jsx(CreatePortfolioDialog, { isOpen: createDialogOpen, onClose: () => setCreateDialogOpen(false) })] }));
    }
    return (_jsxs("div", { className: cn('relative', className), ref: containerRef, children: [_jsxs("button", { onClick: () => setDropdownOpen(!dropdownOpen), className: "flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium text-text-primary bg-surface border border-border hover:border-border-strong hover:bg-surface-elevated transition-colors shadow-subtle", "aria-haspopup": "listbox", "aria-expanded": dropdownOpen, children: [_jsx(Briefcase, { className: "w-3.5 h-3.5 text-amber" }), _jsx("span", { className: "max-w-[140px] truncate", children: activePortfolio?.name || 'Select Portfolio' }), _jsx(ChevronDown, { className: "w-3 h-3 text-text-muted" })] }), dropdownOpen && (_jsxs("div", { className: "absolute right-0 mt-1 w-56 p-1 bg-surface-elevated border border-border rounded shadow-xl z-50 animate-fade-in", children: [_jsxs("div", { className: "px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-text-muted", children: ["Portfolios (", portfolios.length, ")"] }), _jsx("div", { className: "max-h-56 overflow-y-auto space-y-0.5", children: portfolios.map((p) => {
                            const isSelected = p.id === activePortfolio?.id;
                            return (_jsxs("button", { onClick: () => {
                                    setActivePortfolioId(p.id);
                                    setDropdownOpen(false);
                                }, className: cn('w-full flex items-center justify-between px-2.5 py-2 text-xs rounded text-left transition-colors', isSelected
                                    ? 'bg-surface text-amber font-medium'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'), children: [_jsx("span", { className: "truncate", children: p.name }), isSelected && _jsx(Check, { className: "w-3.5 h-3.5 text-amber flex-shrink-0" })] }, p.id));
                        }) }), _jsx("div", { className: "pt-1 mt-1 border-t border-border-subtle", children: _jsxs("button", { onClick: () => {
                                setDropdownOpen(false);
                                setCreateDialogOpen(true);
                            }, className: "w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber hover:text-amber-hover hover:bg-surface/50 rounded transition-colors", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Create New Portfolio" })] }) })] })), _jsx(CreatePortfolioDialog, { isOpen: createDialogOpen, onClose: () => setCreateDialogOpen(false) })] }));
};
