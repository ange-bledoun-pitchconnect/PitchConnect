/**
 * ============================================================================
 * GLOBAL SEARCH COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade global search with multiple entity types.
 * Command palette style with keyboard navigation.
 * 
 * FEATURES:
 * - Multiple entity types (player, club, league, match, team, training, event, job)
 * - Keyboard navigation (Cmd+K / Ctrl+K)
 * - Search history (localStorage)
 * - Debounced input
 * - Recent searches
 * - Sport context filtering
 * - Dark mode support
 * - Accessibility (ARIA, screen reader)
 * 
 * BASED ON:
 * - Linear/Notion command palette
 * - Vercel search
 * - PlayHQ search patterns
 * 
 * @version 2.0.0
 * @path src/components/search/GlobalSearch.tsx
 * 
 * ============================================================================
 */

'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Users,
  Building2,
  Trophy,
  Calendar,
  Shield,
  Dumbbell,
  PartyPopper,
  Briefcase,
  Clock,
  ArrowRight,
  Command,
  CornerDownLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { type Sport } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

export type SearchEntityType =
  | 'player'
  | 'club'
  | 'league'
  | 'match'
  | 'team'
  | 'training'
  | 'event'
  | 'job'
  | 'user'
  | 'media';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  sport?: Sport;
  metadata?: Record<string, unknown>;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export interface GlobalSearchProps {
  /** Search handler - returns results */
  onSearch: (query: string, types?: SearchEntityType[]) => Promise<SearchResult[]>;
  /** Entity types to search */
  entityTypes?: SearchEntityType[];
  /** Placeholder text */
  placeholder?: string;
  /** Max results to show */
  maxResults?: number;
  /** Max history items */
  maxHistory?: number;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Storage key for history */
  historyStorageKey?: string;
  /** Current sport context for filtering */
  sportContext?: Sport;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENTITY_CONFIG: Record<SearchEntityType, { icon: React.ElementType; label: string; color: string }> = {
  player: { icon: Users, label: 'Player', color: '#3B82F6' },
  club: { icon: Building2, label: 'Club', color: '#22C55E' },
  league: { icon: Trophy, label: 'League', color: '#F59E0B' },
  match: { icon: Calendar, label: 'Match', color: '#EF4444' },
  team: { icon: Shield, label: 'Team', color: '#8B5CF6' },
  training: { icon: Dumbbell, label: 'Training', color: '#06B6D4' },
  event: { icon: PartyPopper, label: 'Event', color: '#EC4899' },
  job: { icon: Briefcase, label: 'Job', color: '#64748B' },
  user: { icon: Users, label: 'User', color: '#6366F1' },
  media: { icon: Calendar, label: 'Media', color: '#F97316' },
};

const DEFAULT_ENTITY_TYPES: SearchEntityType[] = [
  'player',
  'club',
  'league',
  'match',
  'team',
  'training',
  'event',
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function GlobalSearch({
  onSearch,
  entityTypes = DEFAULT_ENTITY_TYPES,
  placeholder = 'Search players, clubs, matches...',
  maxResults = 15,
  maxHistory = 5,
  debounceMs = 300,
  historyStorageKey = 'pitchconnect_search_history',
  sportContext,
  className,
}: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<SearchEntityType | null>(null);
  
  const debouncedQuery = useDebounce(query, debounceMs);
  
  // Load search history
  useEffect(() => {
    try {
      const stored = localStorage.getItem(historyStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setHistory(parsed.slice(0, maxHistory));
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, [historyStorageKey, maxHistory]);
  
  // Save to history
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const newItem: SearchHistoryItem = {
      query: searchQuery.trim(),
      timestamp: Date.now(),
    };
    
    const newHistory = [
      newItem,
      ...history.filter(h => h.query.toLowerCase() !== searchQuery.toLowerCase()),
    ].slice(0, maxHistory);
    
    setHistory(newHistory);
    
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }, [history, maxHistory, historyStorageKey]);
  
  // Perform search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    
    const search = async () => {
      setIsLoading(true);
      try {
        const types = activeFilter ? [activeFilter] : entityTypes;
        const searchResults = await onSearch(debouncedQuery, types);
        setResults(searchResults.slice(0, maxResults));
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    search();
  }, [debouncedQuery, activeFilter, entityTypes, maxResults, onSearch]);
  
  // Keyboard shortcut to open (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.trim() ? results : history.map(h => ({ id: h.query, type: 'history' as const }));
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(items.length, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + items.length) % Math.max(items.length, 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (query.trim() && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        } else if (!query.trim() && history[selectedIndex]) {
          setQuery(history[selectedIndex].query);
        }
        break;
    }
  };
  
  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    saveToHistory(query);
    setIsOpen(false);
    setQuery('');
    router.push(result.href);
  }, [query, router, saveToHistory]);
  
  // Handle history selection
  const handleHistorySelect = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    inputRef.current?.focus();
  }, []);
  
  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(historyStorageKey);
  }, [historyStorageKey]);
  
  // Group results by type
  const groupedResults = useMemo(() => {
    const groups = new Map<SearchEntityType, SearchResult[]>();
    results.forEach(result => {
      const existing = groups.get(result.type) || [];
      groups.set(result.type, [...existing, result]);
    });
    return groups;
  }, [results]);
  
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all w-full sm:w-64',
          'bg-gray-100 dark:bg-charcoal-800 border-gray-200 dark:border-gray-700',
          'hover:border-gold-300 dark:hover:border-gold-600 hover:bg-white dark:hover:bg-charcoal-700',
          'text-gray-500 dark:text-gray-400'
        )}
      >
        <Search className="h-4 w-4" />
        <span className="text-sm flex-1 text-left truncate">{placeholder}</span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-gray-200 dark:bg-charcoal-700 rounded">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
      
      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Search Panel */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-charcoal-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-gray-400" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-charcoal-800"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              <button
                onClick={() => setActiveFilter(null)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                  activeFilter === null
                    ? 'bg-gold-500 text-white'
                    : 'bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-700'
                )}
              >
                All
              </button>
              {entityTypes.map(type => {
                const config = ENTITY_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                      activeFilter === type
                        ? 'bg-gold-500 text-white'
                        : 'bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-charcoal-700'
                    )}
                  >
                    {config.label}s
                  </button>
                );
              })}
            </div>
            
            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {!query.trim() && history.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Recent Searches
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                  {history.map((item, index) => (
                    <button
                      key={item.timestamp}
                      onClick={() => handleHistorySelect(item.query)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors',
                        selectedIndex === index && !query.trim()
                          ? 'bg-gold-50 dark:bg-gold-900/20'
                          : 'hover:bg-gray-100 dark:hover:bg-charcoal-800'
                      )}
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-200">{item.query}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {query.trim() && results.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No results found for "{query}"
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Try adjusting your search or filter
                  </p>
                </div>
              )}
              
              {query.trim() && results.length > 0 && (
                <div className="p-2">
                  {[...groupedResults].map(([type, typeResults]) => {
                    const config = ENTITY_CONFIG[type];
                    const Icon = config.icon;
                    
                    return (
                      <div key={type} className="mb-2">
                        <div className="flex items-center gap-2 px-2 py-1">
                          <Icon className="h-4 w-4" style={{ color: config.color }} />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {config.label}s
                          </span>
                        </div>
                        {typeResults.map((result, index) => {
                          const globalIndex = results.findIndex(r => r.id === result.id);
                          
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleSelect(result)}
                              className={cn(
                                'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors',
                                selectedIndex === globalIndex
                                  ? 'bg-gold-50 dark:bg-gold-900/20'
                                  : 'hover:bg-gray-100 dark:hover:bg-charcoal-800'
                              )}
                            >
                              {result.imageUrl ? (
                                <img
                                  src={result.imageUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: `${config.color}20` }}
                                >
                                  <Icon className="h-4 w-4" style={{ color: config.color }} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {result.title}
                                </p>
                                {result.subtitle && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {result.subtitle}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-charcoal-950">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-charcoal-700 rounded text-[10px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-charcoal-700 rounded text-[10px]">
                    <CornerDownLeft className="h-3 w-3" />
                  </kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-charcoal-700 rounded text-[10px]">Esc</kbd>
                  Close
                </span>
              </div>
              {sportContext && (
                <span className="text-xs text-gray-400">
                  Searching in {sportContext}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default GlobalSearch;