import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Plus, X, Loader2 } from 'lucide-react';

interface CreatePortfolioDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePortfolioDialog: React.FC<CreatePortfolioDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { createPortfolio } = usePortfolio();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a portfolio name');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createPortfolio(name.trim());
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 bg-surface border border-border rounded-lg shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-amber">
          <Plus className="w-5 h-5" />
          <h2 className="text-base font-semibold text-text-primary tracking-wide">
            Create Investment Portfolio
          </h2>
        </div>

        <p className="text-xs text-text-secondary mb-5 leading-relaxed">
          Create a portfolio to organize holdings and track performance.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded text-xs bg-coral-dim border border-coral/30 text-coral-text">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="portfolio-name" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5">
              Portfolio Name
            </label>
            <input
              id="portfolio-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core Growth Strategy"
              className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border rounded text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-amber transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded border border-transparent hover:border-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-black bg-amber hover:bg-amber-hover rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Creating...' : 'Create Portfolio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
