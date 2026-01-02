/**
 * ============================================================================
 * ⏱️ USE DEBOUNCE HOOK v7.10.1
 * ============================================================================
 * 
 * Debounce values to reduce API calls and improve performance.
 * Commonly used for search inputs and form validation.
 * 
 * @version 7.10.1
 * @path src/hooks/useDebounce.ts
 * ============================================================================
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface DebounceOptions {
  /** Delay in milliseconds before value updates */
  delay?: number;
  /** Execute immediately on first call */
  leading?: boolean;
  /** Execute on trailing edge (default: true) */
  trailing?: boolean;
  /** Maximum time to wait before forcing execution */
  maxWait?: number;
}

// =============================================================================
// USE DEBOUNCE - Value Debouncing
// =============================================================================

/**
 * Debounce a value with configurable delay
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Debounced value
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     searchAPI(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// USE DEBOUNCE CALLBACK - Function Debouncing
// =============================================================================

/**
 * Create a debounced version of a callback function
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @param deps - Dependencies array
 * @returns Debounced callback function
 * 
 * @example
 * const debouncedSave = useDebouncedCallback(
 *   (data) => saveToAPI(data),
 *   500,
 *   []
 * );
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, ...deps]);
}

// =============================================================================
// USE DEBOUNCE STATE - Value + Setter
// =============================================================================

/**
 * Debounced state hook - provides both immediate and debounced values
 * @param initialValue - Initial value
 * @param delay - Delay in milliseconds
 * @returns [immediateValue, debouncedValue, setValue]
 * 
 * @example
 * const [search, debouncedSearch, setSearch] = useDebouncedState('', 300);
 * 
 * // search updates immediately for UI
 * // debouncedSearch updates after delay for API calls
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 500
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

// =============================================================================
// USE THROTTLE - Throttled Value
// =============================================================================

/**
 * Throttle a value - limit updates to once per interval
 * @param value - Value to throttle
 * @param interval - Minimum time between updates in milliseconds
 * @returns Throttled value
 * 
 * @example
 * const throttledPosition = useThrottle(mousePosition, 100);
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastExecution);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// =============================================================================
// USE THROTTLED CALLBACK - Function Throttling
// =============================================================================

/**
 * Create a throttled version of a callback function
 * @param callback - Function to throttle
 * @param interval - Minimum time between calls in milliseconds
 * @param deps - Dependencies array
 * @returns Throttled callback function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const lastExecuted = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= interval) {
      lastExecuted.current = now;
      callbackRef.current(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastExecuted.current = Date.now();
        callbackRef.current(...args);
      }, interval - timeSinceLastExecution);
    }
  }, [interval, ...deps]);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useDebounce;
