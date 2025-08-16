'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  // Resolved theme that is actually applied to the document (light or dark)
  theme: Theme;
  // Mode selected by the user (light, dark, or system)
  mode: ThemeMode;
  // Set a specific mode
  setMode: (mode: ThemeMode) => void;
  // Cycle between modes (dark → light → system → dark)
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');

  // Track system preference and update when it changes
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

  // On first mount, read stored mode (backward compatible with old keys)
  useEffect(() => {
    const storedMode = (localStorage.getItem('theme-mode') as ThemeMode | null);
    const legacyUserOverride = localStorage.getItem('theme-user-override') === 'true';
    const legacyTheme = localStorage.getItem('theme') as Theme | null;

    // Default to system unless we detect an explicit legacy override
    if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
      setMode(storedMode);
    } else if (legacyUserOverride && (legacyTheme === 'light' || legacyTheme === 'dark')) {
      setMode(legacyTheme);
    } else {
      setMode('system');
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemPreference = () => setSystemPrefersDark(mediaQuery.matches);

    updateSystemPreference();
    mediaQuery.addEventListener('change', updateSystemPreference);
    return () => mediaQuery.removeEventListener('change', updateSystemPreference);
  }, []);

  // Resolve the actual theme to apply (light or dark)
  const resolvedTheme: Theme = useMemo(() => {
    if (mode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemPrefersDark]);

  // Apply the resolved theme class to <html> and persist the chosen mode
  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme-mode', mode);
    // Keep legacy key for compatibility with any old usages
    localStorage.setItem('theme', resolvedTheme);
  }, [mode, resolvedTheme]);

  const cycleMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : prev === 'light' ? 'system' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, mode, setMode, toggleTheme: cycleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}