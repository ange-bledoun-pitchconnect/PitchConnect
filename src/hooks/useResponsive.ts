'use client';

/**
 * Responsive Hook
 * Path: src/hooks/useResponsive.ts
 * 
 * Provides hooks for:
 * - Breakpoint detection
 * - Media queries
 * - Touch detection
 * - Orientation detection
 * - Real-time responsive updates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getResponsiveState,
  isTouchCapable,
  getCurrentBreakpoint,
  getViewportWidth,
  getViewportHeight,
  getOrientation,
  type ResponsiveState,
  type Breakpoint,
  type Orientation,
} from '@/lib/mobile/mobile-utils';

/**
 * Hook for responsive state
 */
export function useResponsive() {
  const [state, setState] = useState<ResponsiveState>(() =>
    getResponsiveState()
  );

  useEffect(() => {
    // Update on mount
    setState(getResponsiveState());

    // Update on resize
    const handleResize = () => {
      setState(getResponsiveState());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}

/**
 * Hook for media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Hook to detect if device is mobile
 */
export function useMobile() {
  const state = useResponsive();
  return state.isMobile;
}

/**
 * Hook to detect if device is tablet
 */
export function useTablet() {
  const state = useResponsive();
  return state.isTablet;
}

/**
 * Hook to detect if device is desktop
 */
export function useDesktop() {
  const state = useResponsive();
  return state.isDesktop;
}

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(
    () => getCurrentBreakpoint()
  );

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return breakpoint;
}

/**
 * Hook to detect if breakpoint is active
 */
export function useBreakpointActive(breakpoint: Breakpoint): boolean {
  const current = useBreakpoint();
  return current === breakpoint;
}

/**
 * Hook to detect touch device
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchCapable());
  }, []);

  return isTouch;
}

/**
 * Hook to detect orientation
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(
    () => getOrientation()
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * Hook to get viewport size
 */
export function useViewportSize(): {
  width: number;
  height: number;
} {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? getViewportWidth() : 1024,
    height: typeof window !== 'undefined' ? getViewportHeight() : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: getViewportWidth(),
        height: getViewportHeight(),
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Hook for conditional rendering based on breakpoint
 */
export function useShowOn(
  breakpoint: Breakpoint,
  type: 'up' | 'down' | 'only' = 'up'
): boolean {
  const state = useResponsive();
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
  const breakpointIndex = breakpoints.indexOf(breakpoint);
  const currentIndex = breakpoints.indexOf(state.md ? 'md' : state.lg ? 'lg' : state.xs ? 'xs' : state.xl ? 'xl' : 'sm');

  switch (type) {
    case 'up':
      return currentIndex >= breakpointIndex;
    case 'down':
      return currentIndex <= breakpointIndex;
    case 'only':
      return currentIndex === breakpointIndex;
    default:
      return true;
  }
}

/**
 * Hook to detect if viewport has safe areas (notch, bottom bar)
 */
export function useHasSafeArea(): boolean {
  const [hasSafeArea, setHasSafeArea] = useState(false);

  useEffect(() => {
    const checkSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      const top = style.getPropertyValue('safe-area-inset-top');
      const bottom = style.getPropertyValue('safe-area-inset-bottom');

      setHasSafeArea(
        (parseInt(top) || 0) > 0 || (parseInt(bottom) || 0) > 0
      );
    };

    checkSafeArea();
    window.addEventListener('orientationchange', checkSafeArea);

    return () => window.removeEventListener('orientationchange', checkSafeArea);
  }, []);

  return hasSafeArea;
}
