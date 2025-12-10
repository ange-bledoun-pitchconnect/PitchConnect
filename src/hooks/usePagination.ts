// ============================================================================
// PHASE 9: src/hooks/usePagination.ts
// Custom Hook for Pagination State Management
//
// Features:
// - Manage page state
// - Handle page size changes
// - Calculate total pages
// - Reset to first page
//
// Usage:
// const { page, pageSize, setPage, setPageSize, totalPages } = usePagination(100, 25)
// ============================================================================

'use client';

import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPageSize?: number;
}

/**
 * Manage pagination state
 */
export function usePagination(
  totalItems: number,
  options: UsePaginationOptions = {}
) {
  const { initialPageSize = 25 } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  // Validate and set page
  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  }, [totalPages]);

  // Go to next page
  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  // Go to previous page
  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  // Reset to first page
  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  // Change page size
  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when size changes
  }, []);

  // Calculate start and end indices
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    setPageSize: changePageSize,
  };
}

export default usePagination;
