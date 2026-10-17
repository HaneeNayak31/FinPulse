import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Inbox } from 'lucide-react';
import { cn } from '../lib/utils';
export const EmptyState = ({ title, description, icon: Icon = Inbox, action, className, }) => {
    return (_jsxs("div", { className: cn('p-8 rounded-lg bg-surface border border-border text-center flex flex-col items-center justify-center', className), children: [_jsx("div", { className: "w-12 h-12 rounded-full border border-border bg-surface-elevated flex items-center justify-center text-text-muted mb-3", children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsx("h3", { className: "text-sm font-semibold text-text-primary mb-1", children: title }), _jsx("p", { className: "text-xs text-text-muted max-w-sm mb-4 leading-relaxed", children: description }), action && (_jsx("button", { onClick: action.onClick, className: "px-4 py-2 text-xs font-mono font-medium text-black bg-amber hover:bg-amber-hover rounded transition-colors", children: action.label }))] }));
};
