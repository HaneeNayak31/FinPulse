import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../lib/utils';
export const PortfolioMetricCard = ({ label, value, subtitle, icon: Icon, badge, isLoading, className, }) => {
    if (isLoading) {
        return (_jsxs("div", { className: cn('p-5 rounded-lg bg-surface border border-border flex flex-col justify-between min-h-[144px]', className), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "h-3.5 w-28 bg-surface-elevated rounded animate-pulse" }), _jsx("div", { className: "w-6 h-6 bg-surface-elevated rounded animate-pulse" })] }), _jsxs("div", { className: "space-y-2 mt-4", children: [_jsx("div", { className: "h-7 w-36 bg-surface-elevated rounded animate-pulse" }), _jsx("div", { className: "h-3 w-44 bg-surface-elevated rounded animate-pulse" })] })] }));
    }
    const badgeStyles = {
        positive: 'bg-sage-dim text-sage-text border-sage/30',
        negative: 'bg-coral-dim text-coral-text border-coral/30',
        neutral: 'bg-surface-elevated text-text-muted border-border',
        amber: 'bg-amber-muted text-amber border-amber/30',
    };
    return (_jsxs("div", { className: cn('p-5 rounded-lg bg-surface border border-border shadow-subtle flex flex-col justify-between min-h-[148px] transition-colors hover:border-border-strong', className), children: [_jsxs("div", { className: "flex items-center justify-between text-text-muted mb-2", children: [_jsx("span", { className: "text-[11px] font-mono uppercase tracking-wider text-text-muted font-medium", children: label }), _jsx("div", { className: "p-1.5 rounded-md bg-surface-elevated text-text-secondary border border-border-subtle flex-shrink-0", children: _jsx(Icon, { className: "w-3.5 h-3.5" }) })] }), _jsx("div", { className: "my-1", children: _jsx("div", { className: "text-2xl font-bold font-mono tracking-tight text-text-primary tabular-nums", children: value }) }), _jsxs("div", { className: "flex flex-wrap items-center gap-1.5 pt-1 text-xs", children: [badge && (_jsx("span", { className: cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wider', badgeStyles[badge.variant]), children: badge.text })), _jsx("span", { className: "text-[11px] text-text-muted font-sans leading-relaxed", children: subtitle })] })] }));
};
