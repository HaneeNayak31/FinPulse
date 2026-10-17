import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  History,
  LogOut,
  Terminal,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ConnectionStatus } from './ConnectionStatus';
import { cn } from '../lib/utils';

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
    { name: 'Markets', path: '/markets', icon: TrendingUp },
    { name: 'Orders', path: '/orders', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar border-r border-border text-text-secondary transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border bg-surface/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded border border-amber/40 bg-amber-muted text-amber">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-wide text-text-primary text-base font-sans">
                  FinPulse
                </span>
                <span className="text-[10px] font-mono tracking-widest text-amber uppercase border border-amber-border px-1 py-0.2 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] tracking-wider text-text-muted font-mono uppercase">
                {theme === 'dark' ? 'Obsidian Terminal' : 'Warm Ledger'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-text-primary lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-text-muted">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium tracking-wide transition-colors duration-150',
                    isActive
                      ? 'bg-surface text-text-primary border-l-2 border-amber font-semibold shadow-subtle'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  )
                }
              >
                <Icon className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-text-muted">
            Environment
          </div>
          <div className="px-3 py-2 text-xs text-text-muted flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            <span className="text-[11px] font-mono">Simulated Paper Mode</span>
          </div>
        </nav>

        {/* Footer with connection telemetry and profile */}
        <div className="p-3 border-t border-border space-y-3 bg-surface/20">
          <ConnectionStatus />

          {/* User Profile Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-medium text-text-primary truncate">
                {user?.email || 'Authenticated'}
              </div>
              <div className="text-[10px] font-mono text-text-muted truncate">
                UID #{user?.id || '—'}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded text-text-muted hover:text-coral hover:bg-surface-elevated transition-colors"
              title="Sign out of FinPulse"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
