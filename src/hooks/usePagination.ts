/**
 * ============================================================================
 * 📄 USE PAGINATION HOOK v7.10.1 - ADVANCED PAGINATION
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/usePagination.ts
 * ============================================================================
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface PaginationConfig {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  totalItems?: number;
  syncWithUrl?: boolean;
  pageParamName?: string;
  pageSizeParamName?: string;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  offset: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  pageRange: number[];
  pageSizeOptions: number[];
  
  // Actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setTotalItems: (total: number) => void;
  reset: () => void;
  
  // For API calls
  getPaginationParams: () => { page: number; limit: number; offset: number };
}

export function usePagination(config: PaginationConfig = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    totalItems: initialTotalItems = 0,
    syncWithUrl = false,
    pageParamName = 'page',
    pageSizeParamName = 'pageSize',
  } = config;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get initial values from URL if syncing
  const getInitialPage = () => {
    if (syncWithUrl && searchParams) {
      const urlPage = searchParams.get(pageParamName);
      return urlPage ? Math.max(1, parseInt(urlPage, 10)) : initialPage;
    }
    return initialPage;
  };

  const getInitialPageSize = () => {
    if (syncWithUrl && searchParams) {
      const urlPageSize = searchParams.get(pageSizeParamName);
      const parsed = urlPageSize ? parseInt(urlPageSize, 10) : initialPageSize;
      return pageSizeOptions.includes(parsed) ? parsed : initialPageSize;
    }
    return initialPageSize;
  };

  const [page, setPageState] = useState(getInitialPage);
  const [pageSize, setPageSizeState] = useState(getInitialPageSize);
  const [totalItems, setTotalItemsState] = useState(initialTotalItems);

  // Update URL when pagination changes
  const updateUrl = useCallback((newPage: number, newPageSize: number) => {
    if (!syncWithUrl || typeof window === 'undefined') return;

    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (newPage !== 1) {
      params.set(pageParamName, newPage.toString());
    } else {
      params.delete(pageParamName);
    }

    if (newPageSize !== initialPageSize) {
      params.set(pageSizeParamName, newPageSize.toString());
    } else {
      params.delete(pageSizeParamName);
    }

    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [syncWithUrl, searchParams, pageParamName, pageSizeParamName, initialPageSize, router, pathname]);

  // Derived values
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [totalItems, pageSize]);
  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  // Page range for pagination UI
  const pageRange = useMemo(() => {
    const range: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }, [page, totalPages]);

  // Actions
  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPageState(validPage);
    updateUrl(validPage, pageSize);
  }, [totalPages, pageSize, updateUrl]);

  const setPageSize = useCallback((newSize: number) => {
    if (!pageSizeOptions.includes(newSize)) return;
    
    // Calculate new page to maintain approximate position
    const currentFirstItem = (page - 1) * pageSize + 1;
    const newPage = Math.max(1, Math.ceil(currentFirstItem / newSize));
    
    setPageSizeState(newSize);
    setPageState(newPage);
    updateUrl(newPage, newSize);
  }, [page, pageSize, pageSizeOptions, updateUrl]);

  const nextPage = useCallback(() => {
    if (hasNextPage) setPage(page + 1);
  }, [hasNextPage, page, setPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) setPage(page - 1);
  }, [hasPrevPage, page, setPage]);

  const firstPage = useCallback(() => setPage(1), [setPage]);
  const lastPage = useCallback(() => setPage(totalPages), [setPage, totalPages]);

  const setTotalItems = useCallback((total: number) => {
    setTotalItemsState(total);
    // Adjust page if current page is beyond new total
    const newTotalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > newTotalPages) {
      setPage(newTotalPages);
    }
  }, [page, pageSize, setPage]);

  const reset = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
    updateUrl(initialPage, initialPageSize);
  }, [initialPage, initialPageSize, updateUrl]);

  const getPaginationParams = useCallback(() => ({
    page,
    limit: pageSize,
    offset,
  }), [page, pageSize, offset]);

  // Sync from URL changes
  useEffect(() => {
    if (!syncWithUrl || !searchParams) return;
    
    const urlPage = searchParams.get(pageParamName);
    const urlPageSize = searchParams.get(pageSizeParamName);
    
    if (urlPage) {
      const parsed = parseInt(urlPage, 10);
      if (!isNaN(parsed) && parsed !== page) {
        setPageState(Math.max(1, parsed));
      }
    }
    
    if (urlPageSize) {
      const parsed = parseInt(urlPageSize, 10);
      if (!isNaN(parsed) && pageSizeOptions.includes(parsed) && parsed !== pageSize) {
        setPageSizeState(parsed);
      }
    }
  }, [searchParams, syncWithUrl, pageParamName, pageSizeParamName, page, pageSize, pageSizeOptions]);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    offset,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    pageRange,
    pageSizeOptions,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setTotalItems,
    reset,
    getPaginationParams,
  };
}

export default usePagination;
