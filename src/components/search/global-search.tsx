'use client';

import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Users,
  Trophy,
  BarChart3,
  Clock,
  X,
  Zap,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'player':
      return <Users className="w-4 h-4" />;
    case 'club':
      return <Trophy className="w-4 h-4" />;
    case 'league':
      return <BarChart3 className="w-4 h-4" />;
    case 'match':
      return <TrendingUp className="w-4 h-4" />;
    default:
      return <Search className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'player':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'club':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'league':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'match':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

/**
 * Global Search Component
 * Search across players, clubs, leagues, and matches with history
 */
export function GlobalSearch({
  placeholder = 'Search players, clubs, leagues, matches...',
  className = '',
  onResultSelect,
}: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const {
    query,
    setQuery,
    results,
    isLoading,
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
    hasQuery,
  } = useGlobalSearch({
    debounceMs: 300,
    maxResults: 15,
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const itemCount = hasQuery ? results.length : searchHistory.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % itemCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            const item = hasQuery ? results[selectedIndex] : searchHistory[selectedIndex];
            if (item) {
              selectResult(hasQuery ? (item as SearchResult) : null, query);
            }
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, searchHistory, selectedIndex, hasQuery, query]);

  const selectResult = (result: SearchResult | null, searchQuery?: string) => {
    if (result) {
      addToHistory(query, results.length);
      onResultSelect?.(result);
      router.push(result.href);
      setIsOpen(false);
      setQuery('');
    } else if (searchQuery) {
      addToHistory(searchQuery, results.length);
      setIsOpen(false);
    }
  };

  const displayItems = hasQuery ? results : searchHistory.slice(0, 8);

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50">
          {/* Empty State */}
          {!hasQuery && searchHistory.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <Zap className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Start typing to search</p>
            </div>
          ) : isLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Searching...
                </span>
              </div>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* Search Results or History */}
              <div className="max-h-96 overflow-y-auto">
                {displayItems.map((item, index) => {
                  const isSearchResult = hasQuery && 'type' in item;
                  const isSelected = index === selectedIndex;

                  return isSearchResult ? (
                    // Search Result Item
                    <button
                      key={(item as SearchResult).id}
                      onClick={() =>
                        selectResult(item as SearchResult)
                      }
                      className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      } border-b border-gray-100 dark:border-gray-700 last:border-b-0`}
                    >
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-lg ${getTypeColor((item as SearchResult).type)}`}
                      >
                        {getIcon((item as SearchResult).type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {(item as SearchResult).title}
                        </p>
                        {(item as SearchResult).subtitle && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {(item as SearchResult).subtitle}
                          </p>
                        )}
                      </div>
                      <span
                        className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor((item as SearchResult).type)}`}
                      >
                        {(item as SearchResult).type}
                      </span>
                    </button>
                  ) : (
                    // History Item
                    <div
                      key={(item as any).id}
                      className={`px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      } border-b border-gray-100 dark:border-gray-700 last:border-b-0 group`}
                    >
                      <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() =>
                            selectResult(null, (item as SearchHistory).query)
                          }
                          className="font-medium text-gray-900 dark:text-white truncate hover:underline"
                        >
                          {(item as SearchHistory).query}
                        </button>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {(item as SearchHistory).resultCount} results
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromHistory((item as SearchHistory).id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              {!hasQuery && searchHistory.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                  <button
                    onClick={clearHistory}
                    className="w-full text-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium py-2 transition-colors"
                  >
                    Clear Search History
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
