import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-mono transition-colors duration-150',
        'border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary shadow-subtle',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
        className
      )}
    title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    aria-label={`Current theme: ${isDark ? 'dark' : 'light'}. Click to switch theme.`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber transition-transform duration-200 rotate-0 hover:rotate-45" />
          <span className="hidden sm:inline text-[11px] font-medium tracking-wider">DARK</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-amber transition-transform duration-200 rotate-0 hover:-rotate-12" />
          <span className="hidden sm:inline text-[11px] font-medium tracking-wider">LIGHT</span>
        </>
      )}
    </button>
  );
};
