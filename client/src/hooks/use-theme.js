import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

const STORAGE_KEY = 'theme';
const { THEME_PREFIX } = window;
const DARK = 'dark';
const LIGHT = 'light';
const SYSTEM = 'system';

const ThemeContext = createContext(null);

function getSystemColorScheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === DARK || stored === LIGHT || stored === SYSTEM) {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }

  return SYSTEM;
}

function withPrefix(colorScheme) {
  return THEME_PREFIX && THEME_PREFIX !== '' ? `${THEME_PREFIX}-${colorScheme}` : colorScheme;
}

function resolveTheme(theme) {
  const colorScheme = theme === SYSTEM ? getSystemColorScheme() : theme;

  return withPrefix(colorScheme);
}

export function ThemeProvider({ children }) {
  const disableDarkMode = useSelector((state) => state.root?.config?.theme?.disableDarkMode);
  const [theme, setThemeState] = useState(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(theme));

  const setTheme = useCallback((value) => {
    setThemeState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    if (disableDarkMode) {
      setResolvedTheme(withPrefix(LIGHT));
      return undefined;
    }
    setResolvedTheme(resolveTheme(theme));

    if (theme !== SYSTEM) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e) => {
      setResolvedTheme(withPrefix(e.matches ? DARK : LIGHT));
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [theme, disableDarkMode]);

  const colorScheme = resolvedTheme.endsWith(DARK) ? DARK : LIGHT;

  const value = useMemo(
    () => ({ theme, resolvedTheme, colorScheme, setTheme, disableDarkMode: !!disableDarkMode }),
    [theme, resolvedTheme, colorScheme, setTheme, disableDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
