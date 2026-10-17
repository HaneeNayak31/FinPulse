/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        sidebar: 'var(--bg-sidebar)',
        surface: {
          DEFAULT: 'var(--surface-primary)',
          elevated: 'var(--surface-elevated)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        amber: {
          DEFAULT: 'var(--brand-amber)',
          hover: 'var(--brand-amber-hover)',
          muted: 'var(--brand-amber-muted)',
          border: 'var(--brand-amber-border)',
        },
        sage: {
          DEFAULT: 'var(--color-positive)',
          dim: 'var(--color-positive-dim)',
          text: 'var(--color-positive-text)',
        },
        coral: {
          DEFAULT: 'var(--color-negative)',
          dim: 'var(--color-negative-dim)',
          text: 'var(--color-negative-text)',
        },
      },
      boxShadow: {
        'subtle': 'var(--card-shadow)',
        'elevated': 'var(--elevated-shadow)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
        display: ['Newsreader', 'Georgia', 'serif'],
      },
      animation: {
        'flash-sage': 'flashSage 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'flash-coral': 'flashCoral 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        flashSage: {
          '0%': { backgroundColor: 'var(--color-positive-dim)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashCoral: {
          '0%': { backgroundColor: 'var(--color-negative-dim)' },
          '100%': { backgroundColor: 'transparent' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
