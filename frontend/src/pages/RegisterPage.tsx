import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Eye, EyeOff, Loader2, ShieldAlert, Activity } from 'lucide-react';
import { MarketTickerStrip } from '../components/MarketTickerStrip';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Username, email, and password are all required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register(username.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. User may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Market Ticker Strip at top */}
      <MarketTickerStrip />

      {/* Hero Panel */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left decorative panel */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 bg-surface border-r border-border relative overflow-hidden">
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Glow accent */}
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--brand-amber) 0%, transparent 70%)' }}
          />

          {/* Top brand mark */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg border border-amber/40 bg-amber-muted flex items-center justify-center text-amber">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold tracking-wide text-text-primary text-base">FinPulse</div>
                <div className="text-[10px] font-mono text-amber uppercase tracking-widest">
                  Obsidian Terminal v1.0
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-text-primary leading-snug mb-4">
              Begin Your<br />
              <span className="text-amber">Trading Journey</span>
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Create your operator account and start a paper-trading portfolio in seconds. Zero real
              capital risk.
            </p>
          </div>

          {/* Benefits */}
          <div className="relative z-10 space-y-3">
            {[
              { label: 'Instant Portfolio Creation', desc: 'Set up multiple strategy books' },
              { label: 'Simulated Market Orders', desc: 'BUY and SELL across AAPL, MSFT, GOOGL' },
              { label: 'Real-time P&L Tracking', desc: 'Watch unrealized gains update live' },
            ].map((feat) => (
              <div key={feat.label} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-text-primary font-mono">{feat.label}</div>
                  <div className="text-[11px] text-text-muted">{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom notice */}
          <div className="relative z-10 flex items-center gap-2 text-[11px] font-mono text-text-muted">
            <Activity className="w-3.5 h-3.5 text-sage" />
            <span>Paper-trading environment — no real capital at risk</span>
          </div>
        </div>

        {/* Right: registration form */}
        <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 min-h-0">
          <div className="w-full max-w-md">
            {/* Mobile-only brand header */}
            <div className="flex flex-col items-center mb-8 text-center lg:hidden">
              <div className="w-12 h-12 rounded-lg border border-amber/40 bg-amber-muted flex items-center justify-center text-amber mb-3">
                <Terminal className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                Create Terminal Identity
              </h1>
              <p className="text-xs text-text-muted mt-1 uppercase font-mono tracking-widest">
                Portfolio Registration Engine
              </p>
            </div>

            {/* Card */}
            <div className="p-6 md:p-8 rounded-lg bg-surface border border-border shadow-2xl animate-slide-up">
              <div className="mb-6 pb-4 border-b border-border-subtle">
                <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-text-primary">
                  Operator Registration
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Enter credentials to establish your paper trading ledger.
                </p>
              </div>

              {error && (
                <div
                  className="p-3 mb-5 rounded text-xs bg-coral-dim border border-coral/30 text-coral-text flex items-start gap-2"
                  role="alert"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="register-username"
                    className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5"
                  >
                    Operator Handle / Username
                  </label>
                  <input
                    id="register-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="trader_alpha"
                    className="w-full px-3 py-2.5 text-sm bg-surface-elevated border border-border rounded text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 transition-colors font-mono"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-email"
                    className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@finpulse.local"
                    className="w-full px-3 py-2.5 text-sm bg-surface-elevated border border-border rounded text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 transition-colors font-mono"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5"
                  >
                    Session Password
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-surface-elevated border border-border rounded text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 transition-colors font-mono"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1.5 font-mono">
                    Must be at least 8 characters.
                  </p>
                </div>

                <button
                  type="submit"
                  id="register-submit-btn"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono font-bold tracking-wider text-black bg-amber hover:bg-amber-hover rounded transition-colors disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>REGISTERING...</span>
                    </>
                  ) : (
                    <span>CREATE ACCOUNT &amp; ENTER</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-border-subtle text-center text-xs text-text-muted">
                Already possess credentials?{' '}
                <Link
                  to="/login"
                  className="font-mono text-amber hover:text-amber-hover underline transition-colors"
                >
                  Sign into terminal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
