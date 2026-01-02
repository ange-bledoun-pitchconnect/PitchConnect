/**
 * ============================================================================
 * 📡 USE FETCH HOOK v7.10.1 - DATA FETCHING WITH CACHING
 * ============================================================================
 * 
 * Custom fetch hook with caching, error handling, and retry logic.
 * 
 * @version 7.10.1
 * @path src/hooks/useFetch.ts
 * ============================================================================
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface UseFetchOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown> | FormData;
  cache?: number;
  skip?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  mutate: (newData: T | ((prev: T | null) => T)) => void;
}

// =============================================================================
// GLOBAL CACHE
// =============================================================================

const globalCache = new Map<string, CacheEntry<unknown>>();

// =============================================================================
// HOOK
// =============================================================================

export function useFetch<T = unknown>(
  url: string,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options.skip);
  const [error, setError] = useState<Error | null>(null);

  const cacheKeyRef = useRef<string>(`${options.method || 'GET'}:${url}`);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const {
    method = 'GET',
    headers = {},
    body,
    cache = 5 * 60 * 1000,
    skip = false,
    onSuccess,
    onError,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = cacheKeyRef.current;

      // Check cache for GET requests
      if (method === 'GET' && globalCache.has(cacheKey)) {
        const cached = globalCache.get(cacheKey) as CacheEntry<T>;
        if (Date.now() - cached.timestamp < cache) {
          setData(cached.data);
          setLoading(false);
          onSuccess?.(cached.data);
          return;
        }
      }

      // Create abort controller
      abortControllerRef.current = new AbortController();

      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: abortControllerRef.current.signal,
      };

      if (body && method !== 'GET') {
        fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
        if (body instanceof FormData) {
          delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
        }
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Cache successful GET responses
      if (method === 'GET') {
        globalCache.set(cacheKey, { data: result, timestamp: Date.now() });
      }

      setData(result as T);
      setError(null);
      retryCountRef.current = 0;
      onSuccess?.(result as T);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const error = err instanceof Error ? err : new Error(String(err));
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => fetchData(), retryDelay * retryCountRef.current);
        return;
      }

      setError(error);
      setData(null);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, method, headers, body, cache, onSuccess, onError, retryCount, retryDelay]);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [url, method, skip, fetchData]);

  const refetch = useCallback(async () => {
    globalCache.delete(cacheKeyRef.current);
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  const clearCache = useCallback(() => {
    globalCache.delete(cacheKeyRef.current);
  }, []);

  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setData(prev => typeof newData === 'function' ? (newData as (prev: T | null) => T)(prev) : newData);
  }, []);

  return { data, loading, error, refetch, clearCache, mutate };
}

// =============================================================================
// MUTATION HOOK
// =============================================================================

interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | null, error: Error | null, variables: V) => void;
}

interface UseMutationReturn<T, V> {
  mutate: (variables: V) => Promise<T>;
  mutateAsync: (variables: V) => Promise<T>;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

export function useMutation<T = unknown, V = unknown>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationReturn<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const mutateAsync = useCallback(async (variables: V): Promise<T> => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      setIsSuccess(true);
      options.onSuccess?.(result, variables);
      options.onSettled?.(result, null, variables);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsError(true);
      options.onError?.(error, variables);
      options.onSettled?.(null, error, variables);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  const mutate = useCallback((variables: V): Promise<T> => {
    return mutateAsync(variables).catch(() => null as unknown as T);
  }, [mutateAsync]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
  }, []);

  return { mutate, mutateAsync, data, error, isLoading, isSuccess, isError, reset };
}

export default useFetch;
