// ─── src/contexts/ThemeContext.tsx ────────────────────────────────────────────
//
// 🎓 WHAT IS THIS FILE?
// This is the "source of truth" for your app's theme (dark / light).
// Any component anywhere in the tree can read or change the theme
// by calling the `useTheme()` hook — no prop-drilling required.
//
// 🎓 PATTERN USED: React Context + Custom Hook
// - ThemeContext     → the shared data container
// - ThemeProvider    → wraps your app and owns the state
// - useTheme()       → the public API every component calls
//
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ── 1. Types ──────────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

// ── 2. Create the context ─────────────────────────────────────────────────────
// We default to `undefined` so the hook below can detect misuse (component
// called outside the provider) and throw a helpful error instead of silently
// returning wrong values.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ── 3. Provider component ─────────────────────────────────────────────────────
// Wrap your app (or at least the Dashboard route) with this.
//
// localStorage persistence means the user's preference survives page refreshes.
// The lazy initialiser (() => ...) reads localStorage only ONCE on mount,
// not on every re-render.

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('plantsync_theme') as Theme | null;
    // Only trust the saved value if it's one we actually support
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // useCallback ensures this function reference is stable across renders,
  // which prevents unnecessary re-renders of children that use it.
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('plantsync_theme', next);
      return next;
    });
  }, []);

  const value: ThemeContextType = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── 4. Custom hook ────────────────────────────────────────────────────────────
// This is the ONLY way components should access the context.
// Naming it `useTheme` follows the React convention for custom hooks (use*).
//
// The guard clause means: if a developer forgets to wrap their component
// tree in <ThemeProvider>, they get a clear error message, not a cryptic
// "cannot read property of undefined".

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      '❌ useTheme() must be called inside a <ThemeProvider>.\n' +
      'Did you forget to wrap your app (or route) with <ThemeProvider>?'
    );
  }
  return context;
}