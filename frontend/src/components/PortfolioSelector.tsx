import React, { useState, useRef, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { CreatePortfolioDialog } from './CreatePortfolioDialog';
import { Briefcase, ChevronDown, Plus, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export const PortfolioSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { portfolios, activePortfolio, setActivePortfolioId, isLoading } = usePortfolio();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-8 w-36 rounded bg-surface-elevated animate-pulse" />
    );
  }

  if (portfolios.length === 0) {
    return (
      <>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-amber bg-amber-muted border border-amber/40 hover:border-amber transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Portfolio</span>
        </button>
        <CreatePortfolioDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium text-text-primary bg-surface border border-border hover:border-border-strong hover:bg-surface-elevated transition-colors shadow-subtle"
        aria-haspopup="listbox"
        aria-expanded={dropdownOpen}
      >
        <Briefcase className="w-3.5 h-3.5 text-amber" />
        <span className="max-w-[140px] truncate">{activePortfolio?.name || 'Select Portfolio'}</span>
        <ChevronDown className="w-3 h-3 text-text-muted" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-1 w-56 p-1 bg-surface-elevated border border-border rounded shadow-xl z-50 animate-fade-in">
          <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-text-muted">
            Portfolios ({portfolios.length})
          </div>
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {portfolios.map((p) => {
              const isSelected = p.id === activePortfolio?.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePortfolioId(p.id);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 text-xs rounded text-left transition-colors',
                    isSelected
                      ? 'bg-surface text-amber font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  )}
                >
                  <span className="truncate">{p.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1 mt-1 border-t border-border-subtle">
            <button
              onClick={() => {
                setDropdownOpen(false);
                setCreateDialogOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber hover:text-amber-hover hover:bg-surface/50 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Portfolio</span>
            </button>
          </div>
        </div>
      )}

      <CreatePortfolioDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
};
