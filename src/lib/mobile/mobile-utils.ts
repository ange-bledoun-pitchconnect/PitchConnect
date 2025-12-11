/**
 * Mobile Utilities Module
 * Path: src/lib/mobile/mobile-utils.ts
 * 
 * Provides utilities for:
 * - Responsive breakpoint detection
 * - Touch gesture detection
 * - Mobile-safe viewport handling
 * - Screen size utilities
 * - Device detection helpers
 */

// ============================================================================
// TYPES
// ============================================================================

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveState {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  orientation: Orientation;
}

export interface TouchInfo {
  x: number;
  y: number;
  timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const DEVICE_SIZES = {
  MOBILE_MAX: 767,
  TABLET_MIN: 768,
  TABLET_MAX: 1023,
  DESKTOP_MIN: 1024,
};

export const TOUCH_TARGET_SIZE = 44; // Minimum 44px for touch targets
export const SAFE_AREA_INSETS = {
  top: 'env(safe-area-inset-top, 0)',
  bottom: 'env(safe-area-inset-bottom, 0)',
  left: 'env(safe-area-inset-left, 0)',
  right: 'env(safe-area-inset-right, 0)',
};

// ============================================================================
// VIEWPORT UTILITIES
// ============================================================================

/**
 * Get current viewport width
 */
export function getViewportWidth(): number {
  if (typeof window === 'undefined') return 1024;
  return Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 1024
  );
}

/**
 * Get current viewport height
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 768;
  return Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 768
  );
}

/**
 * Get current device orientation
 */
export function getOrientation(): Orientation {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint {
  const width = getViewportWidth();

  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

/**
 * Check if viewport matches breakpoint or larger
 */
export function isBreakpointUp(breakpoint: Breakpoint): boolean {
  return getViewportWidth() >= BREAKPOINTS[breakpoint];
}

/**
 * Check if viewport is below breakpoint
 */
export function isBreakpointDown(breakpoint: Breakpoint): boolean {
  return getViewportWidth() < BREAKPOINTS[breakpoint];
}

/**
 * Check if viewport is between two breakpoints
 */
export function isBreakpointBetween(
  min: Breakpoint,
  max: Breakpoint
): boolean {
  const width = getViewportWidth();
  return (
    width >= BREAKPOINTS[min] &&
    width < BREAKPOINTS[max]
  );
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  return getViewportWidth() <= DEVICE_SIZES.MOBILE_MAX;
}

/**
 * Check if device is tablet
 */
export function isTabletDevice(): boolean {
  const width = getViewportWidth();
  return (
    width >= DEVICE_SIZES.TABLET_MIN &&
    width <= DEVICE_SIZES.TABLET_MAX
  );
}

/**
 * Check if device is desktop
 */
export function isDesktopDevice(): boolean {
  return getViewportWidth() >= DEVICE_SIZES.DESKTOP_MIN;
}

/**
 * Check if device is touch-capable
 */
export function isTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

// ============================================================================
// RESPONSIVE STATE
// ============================================================================

/**
 * Get complete responsive state
 */
export function getResponsiveState(): ResponsiveState {
  const width = getViewportWidth();
  const height = getViewportHeight();

  return {
    xs: width < BREAKPOINTS.sm,
    sm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    md: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    lg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
    xl: width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'],
    '2xl': width >= BREAKPOINTS['2xl'],
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isDesktop: isDesktopDevice(),
    width,
    height,
    orientation: getOrientation(),
  };
}

// ============================================================================
// TOUCH UTILITIES
// ============================================================================

/**
 * Detect if element is in safe area (away from notches)
 */
export function getElementSafeArea(element: HTMLElement): DOMRect {
  const rect = element.getBoundingClientRect();
  const top = Math.max(rect.top, parseInt(SAFE_AREA_INSETS.top) || 0);
  const left = Math.max(rect.left, parseInt(SAFE_AREA_INSETS.left) || 0);
  const bottom = Math.min(
    rect.bottom,
    window.innerHeight - (parseInt(SAFE_AREA_INSETS.bottom) || 0)
  );
  const right = Math.min(
    rect.right,
    window.innerWidth - (parseInt(SAFE_AREA_INSETS.right) || 0)
  );

  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * Check if element is touch-friendly size (minimum 44px)
 */
export function isTouchFriendly(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= TOUCH_TARGET_SIZE && rect.height >= TOUCH_TARGET_SIZE;
}

/**
 * Get safe touch area for element
 */
export function getSafeTouchArea(element: HTMLElement): DOMRect {
  const rect = element.getBoundingClientRect();
  const minSize = TOUCH_TARGET_SIZE;
  const width = Math.max(rect.width, minSize);
  const height = Math.max(rect.height, minSize);

  return new DOMRect(
    rect.left - (width - rect.width) / 2,
    rect.top - (height - rect.height) / 2,
    width,
    height
  );
}

// ============================================================================
// SCROLL UTILITIES
// ============================================================================

/**
 * Get safe scroll position accounting for safe area
 */
export function getSafeScrollPosition(): {
  top: number;
  left: number;
  paddingTop: number;
  paddingBottom: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, left: 0, paddingTop: 0, paddingBottom: 0 };
  }

  const topInset = parseInt(SAFE_AREA_INSETS.top) || 0;
  const bottomInset = parseInt(SAFE_AREA_INSETS.bottom) || 0;

  return {
    top: window.scrollY || window.pageYOffset,
    left: window.scrollX || window.pageXOffset,
    paddingTop: topInset,
    paddingBottom: bottomInset,
  };
}

/**
 * Lock scroll (for modals)
 */
export function lockScroll(): void {
  if (typeof document === 'undefined') return;

  const scrollY =
    window.scrollY || document.documentElement.scrollTop;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
}

/**
 * Unlock scroll
 */
export function unlockScroll(): void {
  if (typeof document === 'undefined') return;

  const scrollY = parseInt(document.body.style.top || '0') * -1;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
}

// ============================================================================
// SAFE AREA UTILITIES
// ============================================================================

/**
 * Get safe area insets as object
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  const top = computedStyle.getPropertyValue('safe-area-inset-top');
  const right = computedStyle.getPropertyValue('safe-area-inset-right');
  const bottom = computedStyle.getPropertyValue('safe-area-inset-bottom');
  const left = computedStyle.getPropertyValue('safe-area-inset-left');

  return {
    top: parseInt(top) || 0,
    right: parseInt(right) || 0,
    bottom: parseInt(bottom) || 0,
    left: parseInt(left) || 0,
  };
}

/**
 * Apply safe area padding to element
 */
export function applySafeAreaPadding(
  element: HTMLElement,
  sides: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left']
): void {
  const insets = getSafeAreaInsets();

  if (sides.includes('top')) {
    element.style.paddingTop = `${insets.top}px`;
  }
  if (sides.includes('right')) {
    element.style.paddingRight = `${insets.right}px`;
  }
  if (sides.includes('bottom')) {
    element.style.paddingBottom = `${insets.bottom}px`;
  }
  if (sides.includes('left')) {
    element.style.paddingLeft = `${insets.left}px`;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const mobileUtils = {
  getViewportWidth,
  getViewportHeight,
  getOrientation,
  getCurrentBreakpoint,
  isBreakpointUp,
  isBreakpointDown,
  isBreakpointBetween,
  isMobileDevice,
  isTabletDevice,
  isDesktopDevice,
  isTouchCapable,
  getDevicePixelRatio,
  getResponsiveState,
  getElementSafeArea,
  isTouchFriendly,
  getSafeTouchArea,
  getSafeScrollPosition,
  lockScroll,
  unlockScroll,
  getSafeAreaInsets,
  applySafeAreaPadding,
};
