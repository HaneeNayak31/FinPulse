import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Portfolio } from '../types';
import { useAuth } from './AuthContext';
import { queryKeys } from '../lib/queryKeys';

interface PortfolioContextType {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  activePortfolioId: number | null;
  setActivePortfolioId: (id: number) => void;
  isLoading: boolean;
  createPortfolio: (name: string) => Promise<Portfolio>;
  refetchPortfolios: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const saved = localStorage.getItem('finpulse_active_portfolio');
    return saved ? Number(saved) : null;
  });

  const {
    data: portfolios = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.portfolios.lists(),
    queryFn: api.portfolios.list,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  // Ensure an active portfolio is always selected if available
  useEffect(() => {
    if (portfolios.length > 0) {
      const match = portfolios.find((p) => p.id === selectedId);
      if (!match) {
        setSelectedId(portfolios[0].id);
        localStorage.setItem('finpulse_active_portfolio', String(portfolios[0].id));
      }
    } else {
      setSelectedId(null);
      localStorage.removeItem('finpulse_active_portfolio');
    }
  }, [portfolios, selectedId]);

  const selectPortfolio = (id: number) => {
    setSelectedId(id);
    localStorage.setItem('finpulse_active_portfolio', String(id));
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => api.portfolios.create(name),
    onSuccess: (newPortfolio) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios.all });
      selectPortfolio(newPortfolio.id);
    },
  });

  const activePortfolio = portfolios.find((p) => p.id === selectedId) || null;

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        activePortfolio,
        activePortfolioId: activePortfolio?.id || null,
        setActivePortfolioId: selectPortfolio,
        isLoading,
        createPortfolio: createMutation.mutateAsync,
        refetchPortfolios: refetch,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

