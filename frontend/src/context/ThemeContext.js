import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
const THEME_STORAGE_KEY = 'finpulse_theme';
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (stored === 'light' || stored === 'dark') {
                return stored;
            }
        }
        catch {
            // ignore
        }
        // Fall back to system preference or default dark (Obsidian Terminal)
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    });
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
            root.setAttribute('data-theme', 'dark');
            if (body) {
                body.classList.add('dark');
                body.classList.remove('light');
                body.setAttribute('data-theme', 'dark');
            }
            if (metaTheme)
                metaTheme.setAttribute('content', '#10110F');
        }
        else {
            root.classList.add('light');
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
            if (body) {
                body.classList.add('light');
                body.classList.remove('dark');
                body.setAttribute('data-theme', 'light');
            }
            if (metaTheme)
                metaTheme.setAttribute('content', '#F6F3EC');
        }
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
        catch {
            // ignore
        }
    }, [theme]);
    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };
    return (_jsx(ThemeContext.Provider, { value: { theme, toggleTheme, setTheme }, children: children }));
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
