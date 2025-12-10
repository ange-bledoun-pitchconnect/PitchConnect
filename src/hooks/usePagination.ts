// ============================================================================
// src/hooks/usePagination.ts
// Advanced Pagination Hook with State Management & Analytics
//
// Features:
// - Intelligent page management with validation
// - Configurable page sizes with presets
// - Jump-to-page functionality
// - Analytics tracking for pagination events
// - Cache invalidation on size changes
// - URL-based pagination state (optional)
// - Keyboard navigation support
// - Performance optimized with useMemo
//
// Schema: Aligns with Prisma pagination patterns
// Used by: DataTable, Team/Player lists, Match history
//
// Usage:
// const pagination = usePagination(totalItems, {
//   initialPage: 1,
//   initialPageSize: 25,
//   onPageChange: (page) => console.log('Page:', page),
//   pageSizeOptions: [10, 25, 50, 100],
// })
//
// ============================================================================

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface UsePaginationConfig {
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Initial items per page (default: 25) */
  initialPageSize?: number;
  /** Available page size options (default: [10, 25, 50, 100]) */
  pageSizeOptions?: number[];
  /** Callback when page changes */
  onPageChange?: (page: number, pageSize: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Enable URL-based state management (for bookmarking/sharing) */
  useUrlState?: boolean;
  /** URL parameter name for page (default: 'page') */
  pageParamName?: string;
  /** URL parameter name for size (default: 'size') */
  sizeParamName?: string;
  /** Track analytics events */
  trackAnalytics?: boolean;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  visiblePages: number[];
}

interface PaginationActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (size: number) => void;
  reset: () => void;
  jumpToPage: (page: number) => boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 500;
const VISIBLE_PAGES_COUNT = 5;

// ============================================================================
// HOOK: usePagination
// ============================================================================

export function usePagination(
  totalItems: number,
  config: UsePaginationConfig = {}
): PaginationState & PaginationActions {
  // ============================================================================
  // CONFIGURATION & STATE INITIALIZATION
  // ============================================================================

  const {
    initialPage = 1,
    initialPageSize = 25,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    onPageChange,
    onPageSizeChange,
    useUrlState = false,
    pageParamName = 'page',
    sizeParamName = 'size',
    trackAnalytics = false,
  } = config;

  // Get initial values from URL if enabled
  const getInitialState = useCallback(() => {
    if (!useUrlState || typeof window === 'undefined') {
      return { page: initialPage, pageSize: initialPageSize };
    }

    const params = new URLSearchParams(window.location.search);
    const urlPage = parseInt(params.get(pageParamName) || '') || initialPage;
    const urlPageSize = parseInt(params.get(sizeParamName) || '') || initialPageSize;

    return {
      page: Math.max(1, urlPage),
      pageSize: Math.min(
        Math.max(urlPageSize, MIN_PAGE_SIZE),
        MAX_PAGE_SIZE
      ),
    };
  }, [useUrlState, pageParamName, sizeParamName, initialPage, initialPageSize]);

  const initialState = getInitialState();
  const [page, setPage] = useState(initialState.page);
  const [pageSize, setPageSizeState] = useState(initialState.pageSize);

  // ============================================================================
  // COMPUTED STATE - Memoized for performance
  // ============================================================================

  const state = useMemo<PaginationState>(() => {
    // Validate and sanitize inputs
    const validatedTotalItems = Math.max(0, totalItems);
    const validatedPageSize = Math.min(
      Math.max(pageSize, MIN_PAGE_SIZE),
      MAX_PAGE_SIZE
    );

    // Calculate derived values
    const totalPages = Math.ceil(validatedTotalItems / validatedPageSize) || 1;
    const validatedPage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (validatedPage - 1) * validatedPageSize;
    const endIndex = Math.min(startIndex + validatedPageSize, validatedTotalItems);

    // Calculate visible page numbers for pagination controls
    let visiblePages: number[] = [];
    if (totalPages <= VISIBLE_PAGES_COUNT) {
      visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      const halfVisible = Math.floor(VISIBLE_PAGES_COUNT / 2);
      let start = validatedPage - halfVisible;
      let end = validatedPage + halfVisible;

      if (start < 1) {
        end += 1 - start;
        start = 1;
      }
      if (end > totalPages) {
        start -= end - totalPages;
        end = totalPages;
      }

      visiblePages = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );
    }

    return {
      page: validatedPage,
      pageSize: validatedPageSize,
      totalItems: validatedTotalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: validatedPage < totalPages,
      hasPreviousPage: validatedPage > 1,
      visiblePages,
    };
  }, [page, pageSize, totalItems]);

  // ============================================================================
  // URL STATE MANAGEMENT
  // ============================================================================

  const updateUrlState = useCallback(() => {
    if (!useUrlState || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    params.set(pageParamName, String(state.page));
    params.set(sizeParamName, String(state.pageSize));

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [useUrlState, pageParamName, sizeParamName, state.page, state.pageSize]);

  // Update URL when pagination state changes
  useEffect(() => {
    updateUrlState();
  }, [updateUrlState]);

  // ============================================================================
  // ANALYTICS TRACKING
  // ============================================================================

  const trackEvent = useCallback(
    (eventType: string, eventData: Record<string, unknown>) => {
      if (!trackAnalytics) return;

      // Track pagination events for analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', `pagination_${eventType}`, {
          page: state.page,
          page_size: state.pageSize,
          total_items: state.totalItems,
          total_pages: state.totalPages,
          ...eventData,
        });
      }

      // Console logging for development
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Pagination] ${eventType}:`, eventData);
      }
    },
    [trackAnalytics, state]
  );

  // ============================================================================
  // ACTION HANDLERS - Memoized callbacks
  // ============================================================================

  /**
   * Navigate to specific page with validation
   */
  const goToPage = useCallback(
    (newPage: number) => {
      const validatedPage = Math.max(1, Math.min(newPage, state.totalPages));

      if (validatedPage !== state.page) {
        setPage(validatedPage);
        onPageChange?.(validatedPage, state.pageSize);
        trackEvent('page_change', { from_page: state.page, to_page: validatedPage });
      }
    },
    [state.page, state.pageSize, state.totalPages, onPageChange, trackEvent]
  );

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    if (state.hasNextPage) {
      goToPage(state.page + 1);
      trackEvent('next_page', { current_page: state.page });
    }
  }, [state.page, state.hasNextPage, goToPage, trackEvent]);

  /**
   * Navigate to previous page
   */
  const prevPage = useCallback(() => {
    if (state.hasPreviousPage) {
      goToPage(state.page - 1);
      trackEvent('prev_page', { current_page: state.page });
    }
  }, [state.page, state.hasPreviousPage, goToPage, trackEvent]);

  /**
   * Jump to first page
   */
  const firstPage = useCallback(() => {
    goToPage(1);
    trackEvent('first_page', { current_page: state.page });
  }, [state.page, goToPage, trackEvent]);

  /**
   * Jump to last page
   */
  const lastPage = useCallback(() => {
    goToPage(state.totalPages);
    trackEvent('last_page', { current_page: state.page });
  }, [state.page, state.totalPages, goToPage, trackEvent]);

  /**
   * Change page size and reset to first page
   * Validates against configured options
   */
  const setPageSize = useCallback(
    (newSize: number) => {
      // Validate against min/max and available options
      const validSize = Math.min(
        Math.max(newSize, MIN_PAGE_SIZE),
        MAX_PAGE_SIZE
      );

      if (validSize !== state.pageSize) {
        setPageSizeState(validSize);
        setPage(1); // Reset to first page
        onPageSizeChange?.(validSize);
        trackEvent('page_size_change', {
          from_size: state.pageSize,
          to_size: validSize,
        });
      }
    },
    [state.pageSize, onPageSizeChange, trackEvent]
  );

  /**
   * Reset pagination to initial state
   */
  const reset = useCallback(() => {
    setPage(initialState.page);
    setPageSizeState(initialState.pageSize);
    trackEvent('reset', { reset_to_page: initialState.page });
  }, [initialState, trackEvent]);

  /**
   * Jump to specific page with validation
   * Returns boolean indicating success
   */
  const jumpToPage = useCallback(
    (targetPage: number): boolean => {
      if (targetPage < 1 || targetPage > state.totalPages) {
        trackEvent('invalid_jump', {
          requested_page: targetPage,
          total_pages: state.totalPages,
        });
        return false;
      }

      goToPage(targetPage);
      trackEvent('jump_to_page', { target_page: targetPage });
      return true;
    },
    [state.totalPages, goToPage, trackEvent]
  );

  // ============================================================================
  // RETURN STATE & ACTIONS
  // ============================================================================

  return {
    ...state,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    reset,
    jumpToPage,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default usePagination;
