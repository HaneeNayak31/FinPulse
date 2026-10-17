import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, tokenStorage } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const fetchCurrentUser = useCallback(async () => {
        const token = tokenStorage.get();
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }
        try {
            const res = await queryClient.fetchQuery({
                queryKey: queryKeys.auth.user(),
                queryFn: () => api.auth.me(),
                staleTime: 60000,
            });
            setUser(res.user);
        }
        catch {
            // If token is invalid or expired
            tokenStorage.clear();
            queryClient.clear();
            setUser(null);
        }
        finally {
            setIsLoading(false);
        }
    }, [queryClient]);
    useEffect(() => {
        fetchCurrentUser();
        const handleAuthExpired = () => {
            setUser(null);
            queryClient.clear();
        };
        const handleLogout = () => {
            setUser(null);
            queryClient.clear();
        };
        window.addEventListener('finpulse:auth-expired', handleAuthExpired);
        window.addEventListener('finpulse:auth-logout', handleLogout);
        return () => {
            window.removeEventListener('finpulse:auth-expired', handleAuthExpired);
            window.removeEventListener('finpulse:auth-logout', handleLogout);
        };
    }, [fetchCurrentUser, queryClient]);
    const login = async (email, password) => {
        await api.auth.login(email, password);
        // Invalidate auth query to ensure fresh fetch
        queryClient.removeQueries({ queryKey: queryKeys.auth.all });
        await fetchCurrentUser();
    };
    const register = async (username, email, password) => {
        await api.auth.register(username, email, password);
        // After registration, log in automatically
        await api.auth.login(email, password);
        queryClient.removeQueries({ queryKey: queryKeys.auth.all });
        await fetchCurrentUser();
    };
    const logout = () => {
        api.auth.logout();
        queryClient.clear(); // Wipes all user-specific portfolio, holding, order cached queries
        setUser(null);
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            refreshUser: fetchCurrentUser,
        }, children: children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
