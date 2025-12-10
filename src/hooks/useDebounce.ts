// ============================================================================
// src/hooks/useDebounce.ts
// Custom Hook for Debouncing Values
//
// Features:
// - Debounce search inputs to reduce API calls
// - Configurable delay
// - Clean up on unmount
//
// Usage:
// const debouncedSearchTerm = useDebounce(searchTerm, 500)
// ============================================================================

'use client';

import { useEffect, useState } from 'react';

/**
 * Debounce a value with a delay
 * Useful for search inputs to reduce API calls
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value or delay changes before timeout fires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;

// ============================================================================
// PHASE 9: src/hooks/useDebounce.ts
// Custom Hook for Debouncing Values
//
// Features:
// - Debounce search inputs to reduce API calls
// - Configurable delay
// - Clean up on unmount
//
// Usage:
// const debouncedSearchTerm = useDebounce(searchTerm, 500)
// ============================================================================

'use client';

import { useEffect, useState } from 'react';

/**
 * Debounce a value with a delay
 * Useful for search inputs to reduce API calls
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value or delay changes before timeout fires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
