/**
 * ============================================================================
 * THEME PROVIDER - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade theme management with system preference detection.
 * 
 * FEATURES:
 * - Light/Dark mode toggle
 * - System preference detection
 * - LocalStorage persistence
 * - SSR-safe hydration
 * - Smooth transitions
 * - Multiple theme support (extensible)
 * 
 * @version 2.0.0
 * @path src/components/providers/ThemeProvider.tsx
 * 
 * ============================================================================
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  /** Current theme setting */
  theme: Theme;
  /** Resolved theme (actual light/dark value) */
  resolvedTheme: ResolvedTheme;
  /** Set theme directly */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
  /** Whether the component is hydrated */
  isHydrated: boolean;
  /** System preference */
  systemTheme: ResolvedTheme;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'pitchconnect-theme';
const DEFAULT_THEME: Theme = 'light';

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default theme on first visit */
  defaultTheme?: Theme;
  /** Storage key for persistence */
  storageKey?: string;
  /** Enable system theme detection */
  enableSystem?: boolean;
  /** Disable transitions during theme change */
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = STORAGE_KEY,
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isHydrated, setIsHydrated] = useState(false);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  
  // Detect system preference
  useEffect(() => {
    if (!enableSystem) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    // Initial check
    handleChange(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [enableSystem]);
  
  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
    setIsHydrated(true);
  }, [storageKey]);
  
  // Calculate resolved theme
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);
  
  // Apply theme to document
  useEffect(() => {
    if (!isHydrated) return;
    
    const root = document.documentElement;
    
    // Optionally disable transitions
    if (disableTransitionOnChange) {
      root.classList.add('disable-transitions');
    }
    
    // Update class
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0A0E27' : '#FFFFFF'
      );
    }
    
    // Re-enable transitions
    if (disableTransitionOnChange) {
      requestAnimationFrame(() => {
        root.classList.remove('disable-transitions');
      });
    }
  }, [resolvedTheme, isHydrated, disableTransitionOnChange]);
  
  // Set theme with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  }, [storageKey]);
  
  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setTheme]);
  
  // Context value
  const value: ThemeContextType = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isHydrated,
    systemTheme,
  }), [theme, resolvedTheme, setTheme, toggleTheme, isHydrated, systemTheme]);
  
  // Prevent flash of wrong theme
  if (!isHydrated) {
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    );
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ThemeProvider;