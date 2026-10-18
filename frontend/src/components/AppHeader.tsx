import React from 'react';
import { Menu } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  children?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  children,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 -ml-1 text-text-muted hover:text-text-primary rounded-md hover:bg-surface transition-colors lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-semibold text-text-primary tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-text-muted hidden sm:block tracking-normal truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Children slots such as Portfolio selector */}
          {children}

          <div className="hidden sm:block h-4 w-px bg-border" />

          {/* Market feed indicator */}
          <ConnectionStatus compact />

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
