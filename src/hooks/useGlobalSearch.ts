/**
 * ============================================================================
 * 🔍 USE GLOBAL SEARCH HOOK v7.10.1 - MULTI-ENTITY SEARCH
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/useGlobalSearch.ts
 * ============================================================================
 */

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { Sport } from './useSportConfig';

export type SearchEntityType = 
  | 'player' | 'team' | 'club' | 'match' | 'league' 
  | 'coach' | 'referee' | 'venue' | 'competition' | 'user';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  url?: string;
  sport?: Sport;
  metadata?: Record<string, unknown>;
  score?: number;
}

export interface SearchFilters {
  types?: SearchEntityType[];
  sport?: Sport;
  clubId?: string;
  leagueId?: string;
  limit?: number;
}

export interface UseGlobalSearchOptions {
  debounceMs?: number;
  minChars?: number;
  filters?: SearchFilters;
  enabled?: boolean;
  onSelect?: (result: SearchResult) => void;
}

export interface UseGlobalSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  groupedResults: Record<SearchEntityType, SearchResult[]>;
  isLoading: boolean;
  error: Error | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  selectResult: (result: SearchResult) => void;
  clear: () => void;
  totalResults: number;
  hasResults: boolean;
}

// Cache for search results
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export function useGlobalSearch(options: UseGlobalSearchOptions = {}): UseGlobalSearchReturn {
  const {
    debounceMs = 300,
    minChars = 2,
    filters = {},
    enabled = true,
    onSelect,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedQuery = useDebounce(query, debounceMs);

  // Group results by type
  const groupedResults = useMemo(() => {
    const grouped: Record<SearchEntityType, SearchResult[]> = {
      player: [],
      team: [],
      club: [],
      match: [],
      league: [],
      coach: [],
      referee: [],
      venue: [],
      competition: [],
      user: [],
    };

    results.forEach(result => {
      if (grouped[result.type]) {
        grouped[result.type].push(result);
      }
    });

    return grouped;
  }, [results]);

  const totalResults = results.length;
  const hasResults = totalResults > 0;

  // Search function
  const search = useCallback(async (searchQuery: string) => {
    if (!enabled || searchQuery.length < minChars) {
      setResults([]);
      return;
    }

    // Check cache
    const cacheKey = JSON.stringify({ query: searchQuery, filters });
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResults(cached.results);
      return;
    }

    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ q: searchQuery });
      if (filters.types?.length) params.append('types', filters.types.join(','));
      if (filters.sport) params.append('sport', filters.sport);
      if (filters.clubId) params.append('clubId', filters.clubId);
      if (filters.leagueId) params.append('leagueId', filters.leagueId);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/search?${params}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const searchResults = data.results || [];

      // Cache results
      searchCache.set(cacheKey, { results: searchResults, timestamp: Date.now() });
      setResults(searchResults);
      setSelectedIndex(-1);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('Search failed'));
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, minChars, filters]);

  // Trigger search on debounced query change
  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  // Open dropdown when typing
  useEffect(() => {
    if (query.length >= minChars) {
      setIsOpen(true);
    }
  }, [query, minChars]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || !hasResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < totalResults) {
          selectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, hasResults, selectedIndex, totalResults, results]);

  const selectResult = useCallback((result: SearchResult) => {
    onSelect?.(result);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  }, [onSelect]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    groupedResults,
    isLoading,
    error,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    selectResult,
    clear,
    totalResults,
    hasResults,
  };
}

export default useGlobalSearch;
