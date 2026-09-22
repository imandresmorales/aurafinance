import React, { createContext, useState, useEffect } from 'react';

export const THEMES = [
  { id: 'emerald-glass', label: 'Emerald Glass', swatch: '#10b981', dark: true },
  { id: 'nordic-light', label: 'Luz Nórdico', swatch: '#f4f7f5', dark: false },
  { id: 'neo-brutalist', label: 'Neo-Brutalist', swatch: '#fef08a', dark: false },
  { id: 'high-contrast', label: 'Alto Contraste AAA', swatch: '#00ff66', dark: true },
];

export const ThemeContext = createContext({
  theme: 'emerald-glass',
  resolvedTheme: 'emerald-glass',
  setTheme: () => {},
  availableThemes: THEMES,
});

const STORAGE_KEY = 'aurafinance_theme';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'emerald-glass';
    } catch {
      return 'emerald-glass';
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });

  // Watch for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemPrefersDark(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Compute resolved theme
  const resolvedTheme = theme === 'system'
    ? (systemPrefersDark ? 'emerald-glass' : 'nordic-light')
    : theme;

  // Apply theme to DOM and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('No se pudo guardar la preferencia de tema en localStorage:', e);
    }
  }, [theme, resolvedTheme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, availableThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
