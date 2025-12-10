'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T extends { id: string | number }>(
  { columns, data, pageSize = 25, loading = false, emptyMessage = 'No data available' }: DataTableProps<T>
) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const pagination = usePagination(data.length, { initialPageSize: pageSize });

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const paginatedData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ col }: { col: Column<T> }) => {
    const key = typeof col.accessor === 'string' ? col.accessor : null;
    if (!col.sortable || !key) return <ChevronsUpDown className="w-4 h-4 opacity-40" />;

    if (sortKey !== key) return <ChevronsUpDown className="w-4 h-4 opacity-40" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-gold-500" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gold-500" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  style={{ width: col.width }}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => col.accessor && typeof col.accessor === 'string' && handleSort(col.accessor)}
                      className="flex items-center gap-2 hover:text-gold-500 transition-colors"
                    >
                      {col.header}
                      <SortIcon col={col} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIdx) => (
              <tr
                key={row.id}
                className={`${
                  rowIdx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50 dark:bg-gray-900/50'
                } border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {pagination.startIndex + 1} to {pagination.endIndex} of {pagination.totalItems}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.prevPage()}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.goToPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      pageNum === pagination.page
                        ? 'bg-gold-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => pagination.nextPage()}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
