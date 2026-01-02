/**
 * ============================================================================
 * 📱 USE RESPONSIVE HOOK v7.10.1
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useResponsive.ts
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// Tailwind CSS default breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface UseResponsiveReturn {
  width: number;
  height: number;
  breakpoint: Breakpoint | 'xs';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2Xl: boolean;
  isSmUp: boolean;
  isMdUp: boolean;
  isLgUp: boolean;
  isXlUp: boolean;
  is2XlUp: boolean;
  isSmDown: boolean;
  isMdDown: boolean;
  isLgDown: boolean;
  isXlDown: boolean;
}

export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Check for touch device
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Initial set
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width, height } = dimensions;

  const breakpoint = useMemo((): Breakpoint | 'xs' => {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, [width]);

  return useMemo(() => ({
    width,
    height,
    breakpoint,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isTouch,
    orientation: width > height ? 'landscape' : 'portrait',
    isXs: width < BREAKPOINTS.sm,
    isSm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    isMd: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isLg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
    isXl: width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'],
    is2Xl: width >= BREAKPOINTS['2xl'],
    isSmUp: width >= BREAKPOINTS.sm,
    isMdUp: width >= BREAKPOINTS.md,
    isLgUp: width >= BREAKPOINTS.lg,
    isXlUp: width >= BREAKPOINTS.xl,
    is2XlUp: width >= BREAKPOINTS['2xl'],
    isSmDown: width < BREAKPOINTS.md,
    isMdDown: width < BREAKPOINTS.lg,
    isLgDown: width < BREAKPOINTS.xl,
    isXlDown: width < BREAKPOINTS['2xl'],
  }), [width, height, breakpoint, isTouch]);
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Breakpoint hook
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

export default useResponsive;
