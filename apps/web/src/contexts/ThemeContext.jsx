import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const ThemeContext = createContext(null);

function getInitialMode() {
  try {
    const stored = localStorage.getItem('taggy-theme-mode');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage not available
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('taggy-theme-mode', next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setThemeMode = useCallback((newMode) => {
    if (newMode === 'dark' || newMode === 'light') {
      setMode(newMode);
      try {
        localStorage.setItem('taggy-theme-mode', newMode);
      } catch {
        // ignore
      }
    }
  }, []);

  const value = useMemo(() => ({
    mode,
    toggleTheme,
    setThemeMode,
    isDark: mode === 'dark',
  }), [mode, toggleTheme, setThemeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider');
  }
  return context;
}

export default ThemeContext;
