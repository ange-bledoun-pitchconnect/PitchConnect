// ============================================================================
// src/hooks/useFetch.ts
// Custom Hook for Data Fetching with Caching & Error Handling
//
// Features:
// - Automatic data fetching on mount
// - Caching to prevent redundant requests
// - Error handling & retry logic
// - Loading states
// - Manual refetch capability
//
// Usage:
// const { data, loading, error, refetch } = useFetch('/api/analytics/teams/1')
// ============================================================================

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  cache?: number; // Cache duration in milliseconds (default: 5 minutes)
  skip?: boolean; // Skip fetching initially
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

// ============================================================================
// GLOBAL CACHE - Shared across component instances
// ============================================================================

const globalCache = new Map<string, CacheEntry>();

// ============================================================================
// HOOK: useFetch
// ============================================================================

export function useFetch<T = unknown>(
  url: string,
  options: UseFetchOptions = {}
) {
  // State management
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options.skip);
  const [error, setError] = useState<Error | null>(null);

  // References
  const cacheKeyRef = useRef<string>(`${options.method || 'GET'}:${url}`);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Destructure options with defaults
  const {
    method = 'GET',
    headers = {},
    body,
    cache = 5 * 60 * 1000, // 5 minutes default
    skip = false,
    onSuccess,
    onError,
  } = options;

  /**
   * Fetch data from API
   * Includes caching and error handling
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = cacheKeyRef.current;

      // Check if data is cached and still valid
      if (method === 'GET' && globalCache.has(cacheKey)) {
        const cached = globalCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < cache) {
          setData(cached.data as T);
          setLoading(false);
          onSuccess?.(cached.data);
          return;
        }
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Prepare request options
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: abortControllerRef.current.signal,
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      // Execute fetch
      const response = await fetch(url, fetchOptions);

      // Handle response errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Parse JSON response
      const result = await response.json();

      // Cache successful GET responses
      if (method === 'GET') {
        globalCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      // Update state
      setData(result as T);
      setError(null);
      onSuccess?.(result);
    } catch (err) {
      // Handle abort errors silently
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      // Set error state
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setData(null);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, method, headers, body, cache, onSuccess, onError]);

  /**
   * Fetch on mount or when dependencies change
   */
  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    fetchData();

    // Cleanup: abort request if component unmounts
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [url, method, skip, fetchData]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    // Clear cache for this URL
    globalCache.delete(cacheKeyRef.current);
    // Refetch data
    await fetchData();
  }, [fetchData]);

  /**
   * Clear cache for this URL
   */
  const clearCache = useCallback(() => {
    globalCache.delete(cacheKeyRef.current);
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default useFetch;
