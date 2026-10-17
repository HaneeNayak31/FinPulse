import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../lib/utils';
export const LoadingSkeleton = ({ rows = 3, height = 'h-10', className, }) => {
    return (_jsx("div", { className: cn('space-y-2', className), children: Array.from({ length: rows }).map((_, i) => (_jsx("div", { className: cn('w-full bg-surface-elevated/60 rounded border border-border-subtle animate-pulse', height) }, i))) }));
};
