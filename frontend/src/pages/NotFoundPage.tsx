import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ArrowLeft, AlertTriangle, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Soft amber glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--brand-amber) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 max-w-md">
        {/* Error Code */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg border border-amber/40 bg-amber-muted flex items-center justify-center text-amber">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="font-mono text-6xl font-bold text-text-primary tracking-tight mb-2">
          404
        </div>

        <div className="font-mono text-sm font-semibold text-amber uppercase tracking-widest mb-4">
          ROUTE_NOT_FOUND
        </div>

        <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto mb-8">
          The requested terminal path is not mapped to any active FinPulse workstation component.
          The route you are trying to access does not exist or has been moved.
        </p>

        {/* Status card */}
        <div className="inline-block p-4 rounded-lg bg-surface border border-border mb-8 text-left">
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between gap-6">
              <span className="text-text-muted">Status</span>
              <span className="text-coral-text font-bold">NOT FOUND</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-text-muted">Endpoint</span>
              <span className="text-text-primary font-medium truncate max-w-[200px]">
                {typeof window !== 'undefined' ? window.location.pathname : '/unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-text-muted">Resolution</span>
              <span className="text-sage-text">Return to dashboard</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold text-black bg-amber hover:bg-amber-hover rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            to="/markets"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-medium text-text-secondary hover:text-text-primary bg-surface border border-border hover:border-border-strong rounded transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>View Markets</span>
          </Link>
        </div>

        {/* Terminal brand */}
        <div className="flex items-center justify-center gap-2 mt-10 text-text-muted">
          <Terminal className="w-3.5 h-3.5 text-amber/60" />
          <span className="text-[10px] font-mono tracking-widest uppercase">FinPulse Terminal v1.0</span>
        </div>
      </div>
    </div>
  );
};
