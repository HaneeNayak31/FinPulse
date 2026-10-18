import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Eye, EyeOff, Loader2, ShieldAlert, Activity } from 'lucide-react';
import { MarketTickerStrip } from '../components/MarketTickerStrip';
export const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState(null);
    const [usernameError, setUsernameError] = useState(null);
    const [emailError, setEmailError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const validateEmail = (val) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    };
    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        if (usernameError)
            setUsernameError(null);
        if (formError)
            setFormError(null);
    };
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (emailError)
            setEmailError(null);
        if (formError)
            setFormError(null);
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (passwordError)
            setPasswordError(null);
        if (formError)
            setFormError(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting)
            return;
        let hasClientError = false;
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();
        if (!trimmedUsername) {
            setUsernameError('Username is required.');
            hasClientError = true;
        }
        else if (trimmedUsername.length < 3) {
            setUsernameError('Username must be at least 3 characters.');
            hasClientError = true;
        }
        else {
            setUsernameError(null);
        }
        if (!trimmedEmail) {
            setEmailError('Email address is required.');
            hasClientError = true;
        }
        else if (!validateEmail(trimmedEmail)) {
            setEmailError('Enter a valid email address.');
            hasClientError = true;
        }
        else {
            setEmailError(null);
        }
        if (!password) {
            setPasswordError('Password is required.');
            hasClientError = true;
        }
        else if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters in length.');
            hasClientError = true;
        }
        else {
            setPasswordError(null);
        }
        if (hasClientError) {
            setFormError('Please resolve the errors highlighted below.');
            return;
        }
        setFormError(null);
        setIsSubmitting(true);
        try {
            await register(trimmedUsername, trimmedEmail, password);
            navigate('/dashboard', { replace: true });
        }
        catch (err) {
            setFormError(err instanceof Error ? err.message : 'Registration failed. User may already exist.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [_jsx(MarketTickerStrip, {}), _jsxs("div", { className: "flex-1 flex flex-col lg:flex-row", children: [_jsxs("div", { className: "hidden lg:flex lg:flex-1 flex-col justify-between p-12 bg-surface border-r border-border relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 opacity-[0.03]", style: {
                                    backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
                                    backgroundSize: '32px 32px',
                                } }), _jsx("div", { className: "absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none", style: { background: 'radial-gradient(circle, var(--brand-amber) 0%, transparent 70%)' } }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center gap-3 mb-8", children: [_jsx("div", { className: "w-10 h-10 rounded-lg border border-amber/40 bg-amber-muted flex items-center justify-center text-amber", children: _jsx(Terminal, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold tracking-wide text-text-primary text-base", children: "FinPulse" }), _jsx("div", { className: "text-[10px] font-mono text-amber uppercase tracking-widest", children: "Portfolio tracking" })] })] }), _jsxs("h2", { className: "text-3xl font-bold text-text-primary leading-snug mb-4", children: ["Build your", _jsx("br", {}), _jsx("span", { className: "text-amber", children: "investment practice" })] }), _jsx("p", { className: "text-sm text-text-secondary leading-relaxed max-w-xs", children: "Create an account to track holdings and practice trades with market prices\u2014without using real money." })] }), _jsx("div", { className: "relative z-10 space-y-3", children: [
                                    { label: 'Organize your holdings', desc: 'Create one or more portfolios' },
                                    { label: 'Practice trades', desc: 'Buy and sell popular stocks with paper money' },
                                    { label: 'Review performance', desc: 'See value, allocation, and unrealized return' },
                                ].map((feat) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-amber mt-1.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold text-text-primary font-mono", children: feat.label }), _jsx("div", { className: "text-[11px] text-text-muted", children: feat.desc })] })] }, feat.label))) }), _jsxs("div", { className: "relative z-10 flex items-center gap-2 text-[11px] font-mono text-text-muted", children: [_jsx(Activity, { className: "w-3.5 h-3.5 text-sage" }), _jsx("span", { children: "Paper trading only \u2014 no real money is involved" })] })] }), _jsx("div", { className: "flex flex-1 flex-col justify-center items-center px-4 py-12 min-h-0", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "flex flex-col items-center mb-8 text-center lg:hidden", children: [_jsx("div", { className: "w-12 h-12 rounded-lg border border-amber/40 bg-amber-muted flex items-center justify-center text-amber mb-3", children: _jsx(Terminal, { className: "w-6 h-6" }) }), _jsx("h1", { className: "text-2xl font-bold tracking-tight text-text-primary", children: "Create your account" }), _jsx("p", { className: "text-xs text-text-muted mt-1 uppercase font-mono tracking-widest", children: "Start tracking your portfolio" })] }), _jsxs("div", { className: "p-6 md:p-8 rounded-lg bg-surface border border-border shadow-2xl animate-slide-up", children: [_jsxs("div", { className: "mb-6 pb-4 border-b border-border-subtle", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider font-mono text-text-primary", children: "Create an account" }), _jsx("p", { className: "text-xs text-text-muted mt-0.5", children: "It only takes a moment to get started." })] }), formError && (_jsxs("div", { className: "p-3 mb-5 rounded text-xs bg-coral-dim border border-coral/30 text-coral-text flex items-start gap-2 animate-fade-in", role: "alert", children: [_jsx(ShieldAlert, { className: "w-4 h-4 flex-shrink-0 mt-0.5" }), _jsx("span", { className: "leading-relaxed", children: formError })] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", noValidate: true, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "register-username", className: "block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5", children: "Username" }), _jsx("input", { id: "register-username", type: "text", required: true, autoComplete: "username", value: username, onChange: handleUsernameChange, placeholder: "trader_alpha", "aria-invalid": !!usernameError, "aria-describedby": usernameError ? 'register-username-error' : undefined, className: `w-full px-3 py-2.5 text-sm bg-surface-elevated border rounded text-text-primary placeholder:text-text-muted/50 focus:outline-none transition-colors font-mono ${usernameError
                                                                ? 'border-coral/60 focus:border-coral focus:ring-1 focus:ring-coral/30'
                                                                : 'border-border focus:border-amber focus:ring-1 focus:ring-amber/30'}`, disabled: isSubmitting }), usernameError && (_jsx("p", { id: "register-username-error", className: "text-[11px] font-mono text-coral-text mt-1", children: usernameError }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "register-email", className: "block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5", children: "Email Address" }), _jsx("input", { id: "register-email", type: "email", required: true, autoComplete: "email", value: email, onChange: handleEmailChange, placeholder: "trader@finpulse.local", "aria-invalid": !!emailError, "aria-describedby": emailError ? 'register-email-error' : undefined, className: `w-full px-3 py-2.5 text-sm bg-surface-elevated border rounded text-text-primary placeholder:text-text-muted/50 focus:outline-none transition-colors font-mono ${emailError
                                                                ? 'border-coral/60 focus:border-coral focus:ring-1 focus:ring-coral/30'
                                                                : 'border-border focus:border-amber focus:ring-1 focus:ring-amber/30'}`, disabled: isSubmitting }), emailError && (_jsx("p", { id: "register-email-error", className: "text-[11px] font-mono text-coral-text mt-1", children: emailError }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "register-password", className: "block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "register-password", type: showPassword ? 'text' : 'password', required: true, autoComplete: "new-password", value: password, onChange: handlePasswordChange, placeholder: "Minimum 8 characters", "aria-invalid": !!passwordError, "aria-describedby": passwordError ? 'register-password-error' : undefined, className: `w-full px-3 py-2.5 pr-10 text-sm bg-surface-elevated border rounded text-text-primary placeholder:text-text-muted/50 focus:outline-none transition-colors font-mono ${passwordError
                                                                        ? 'border-coral/60 focus:border-coral focus:ring-1 focus:ring-coral/30'
                                                                        : 'border-border focus:border-amber focus:ring-1 focus:ring-amber/30'}`, disabled: isSubmitting }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors focus:outline-none", "aria-label": showPassword ? 'Hide password' : 'Show password', children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }), passwordError ? (_jsx("p", { id: "register-password-error", className: "text-[11px] font-mono text-coral-text mt-1", children: passwordError })) : (_jsx("p", { className: "text-[10px] text-text-muted mt-1.5 font-mono", children: "Must be at least 8 characters." }))] }), _jsx("button", { type: "submit", id: "register-submit-btn", disabled: isSubmitting, className: "w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono font-bold tracking-wider text-black bg-amber hover:bg-amber-hover rounded transition-colors disabled:opacity-50 mt-2", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), _jsx("span", { children: "REGISTERING..." })] })) : (_jsx("span", { children: "CREATE ACCOUNT" })) })] }), _jsxs("div", { className: "mt-6 pt-4 border-t border-border-subtle text-center text-xs text-text-muted", children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", className: "font-mono text-amber hover:text-amber-hover underline transition-colors", children: "Sign in" })] })] }), _jsx("p", { className: "text-[11px] font-mono text-text-muted/70 text-center mt-6 max-w-sm mx-auto leading-relaxed", children: "Paper-trading account. Never use a password you rely on elsewhere." })] }) })] })] }));
};
