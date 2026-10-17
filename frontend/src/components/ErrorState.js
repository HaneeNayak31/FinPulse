import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
export const ErrorState = ({ title = 'Encountered Data Error', message, onRetry, className, }) => {
    return (_jsxs("div", { className: cn('p-4 rounded-lg bg-coral-dim border border-coral/30 text-coral-text text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3', className), children: [_jsxs("div", { className: "flex items-start gap-2.5", children: [_jsx(AlertCircle, { className: "w-4 h-4 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-text-primary text-xs font-mono", children: title }), _jsx("p", { className: "text-[11px] text-coral-text/90 mt-0.5", children: message })] })] }), onRetry && (_jsxs("button", { onClick: onRetry, className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded border border-coral/40 bg-surface/40 hover:bg-surface text-text-primary self-start sm:self-auto transition-colors", children: [_jsx(RefreshCw, { className: "w-3 h-3" }), _jsx("span", { children: "Retry Request" })] }))] }));
};
