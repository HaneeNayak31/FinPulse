import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
export const AppLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    return (_jsxs("div", { className: "flex h-screen bg-background overflow-hidden", children: [_jsx(AppSidebar, { isOpen: mobileMenuOpen, onClose: () => setMobileMenuOpen(false) }), _jsx("div", { className: "flex flex-col flex-1 min-w-0 overflow-y-auto", children: _jsx(Outlet, { context: { onOpenMobileMenu: () => setMobileMenuOpen(true) } }) })] }));
};
