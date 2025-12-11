'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { debounce } from '@/lib/utils';

export interface SearchResult {
  id: string;
  type: 'player' | 'club' | 'league' | 'match';
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  href: string;
  metadata?: Record<string, any>;
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
}

interface UseGlobalSearchOptions {
  enabled?: boolean;
  debounceMs?: number;
  maxResults?: number;
  maxHistory?: number;
}

const SEARCH_HISTORY_KEY = 'pitchconnect_search_history';
const MAX_HISTORY_DEFAULT = 10;

/**
 * Hook for global search across players, clubs, leagues, and matches
 * Includes search history and debouncing
 */
export function useGlobalSearch({
  enabled = true,
  debounceMs = 300,
  maxResults = 20,
  maxHistory = MAX_HISTORY_DEFAULT,
}: UseGlobalSearchOptions) {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const debouncedQueryRef = useRef<string>('');

  // Load search history from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored) as SearchHistory[];
        setSearchHistory(history.slice(0, maxHistory));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, [maxHistory]);

  // Debounced query update
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedQueryRef.current = query;
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Fetch search results
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', 'global', debouncedQueryRef.current],
    queryFn: async () => {
      if (!debouncedQueryRef.current.trim()) return [];

      const response = await axios.get('/api/search', {
        params: {
          q: debouncedQueryRef.current,
          limit: maxResults,
        },
      });
      return response.data.data;
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 300000, // 5 minutes
  });

  /**
   * Add search to history and save to localStorage
   */
  const addToHistory = (searchQuery: string, resultCount: number) => {
    if (!searchQuery.trim()) return;

    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      query: searchQuery,
      timestamp: new Date(),
      resultCount,
    };

    const updated = [newEntry, ...searchHistory].slice(0, maxHistory);
    setSearchHistory(updated);

    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  };

  /**
   * Clear search history
   */
  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  };

  /**
   * Clear specific history item
   */
  const removeFromHistory = (id: string) => {
    const updated = searchHistory.filter((item) => item.id !== id);
    setSearchHistory(updated);

    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update search history:', error);
    }
  };

  return {
    query,
    setQuery,
    results: (data as SearchResult[]) || [],
    isLoading,
    error: error as Error | null,
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
    hasQuery: query.trim().length > 0,
  };
}

/**
 * Hook for advanced filtering with combinations
 */
export interface FilterOptions {
  type?: ('player' | 'club' | 'league' | 'match')[];
  status?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  position?: string[];
  league?: string[];
  club?: string[];
  minRating?: number;
  maxRating?: number;
}

interface UseAdvancedFilterOptions {
  enabled?: boolean;
}

export function useAdvancedFilter({
  enabled = true,
}: UseAdvancedFilterOptions) {
  const [filters, setFilters] = useState<FilterOptions>({});

  // Fetch filtered results
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search', 'filtered', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.type?.length) {
        params.append('types', filters.type.join(','));
      }
      if (filters.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters.position?.length) {
        params.append('positions', filters.position.join(','));
      }
      if (filters.league?.length) {
        params.append('leagues', filters.league.join(','));
      }
      if (filters.club?.length) {
        params.append('clubs', filters.club.join(','));
      }
      if (filters.minRating !== undefined) {
        params.append('minRating', filters.minRating.toString());
      }
      if (filters.maxRating !== undefined) {
        params.append('maxRating', filters.maxRating.toString());
      }
      if (filters.dateRange) {
        params.append('fromDate', filters.dateRange.from.toISOString());
        params.append('toDate', filters.dateRange.to.toISOString());
      }

      const response = await axios.get(`/api/search/advanced?${params.toString()}`);
      return response.data.data;
    },
    enabled: enabled && Object.keys(filters).length > 0,
    staleTime: 300000,
  });

  /**
   * Update a single filter
   */
  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({});
  };

  /**
   * Reset to default filters
   */
  const resetFilters = (defaults: FilterOptions) => {
    setFilters(defaults);
  };

  return {
    filters,
    updateFilter,
    clearFilters,
    resetFilters,
    results: (data as SearchResult[]) || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
