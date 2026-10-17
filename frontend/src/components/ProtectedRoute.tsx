import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-text-muted relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow accent */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-[0.08] blur-[80px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--brand-amber) 0%, transparent 60%)' }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Animated logo */}
          <div className="w-14 h-14 rounded-xl border border-amber/30 bg-amber-muted/50 flex items-center justify-center text-amber shadow-lg shadow-amber/5">
            <Terminal className="w-7 h-7 animate-pulse" />
          </div>

          {/* Brand text */}
          <div className="text-center">
            <div className="font-semibold text-lg tracking-wide text-text-primary mb-1">
              FinPulse
            </div>
            <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber">
              Obsidian Terminal
            </div>
          </div>

          {/* Loading indicator */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-surface/50 border border-border-subtle">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber" />
            <span className="text-xs font-mono text-text-secondary tracking-wider">
              Verifying session credentials...
            </span>
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-amber/60"
                style={{
                  animation: `pulseSubtle 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
