'use client';

/**
 * Responsive Table Component
 * Path: src/components/mobile/responsive-table.tsx
 * 
 * Features:
 * - Desktop: Standard table view
 * - Tablet: Expandable rows
 * - Mobile: Card-based layout
 * - Sortable columns
 * - Pagination
 * - Search/filter support
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface ResponsiveTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  rowsPerPage?: number;
  onRowClick?: (row: T) => void;
  expandable?: boolean;
  expandedContent?: (row: T) => React.ReactNode;
  searchable?: boolean;
  searchFields?: (keyof T)[];
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ResponsiveTable<T extends { id: string | number }>({
  columns,
  data,
  rowsPerPage = 10,
  onRowClick,
  expandable = false,
  expandedContent,
  searchable = false,
  searchFields = [],
  className = '',
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(
    new Set()
  );

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery || searchFields.length === 0) {
      return data;
    }

    return data.filter((row) =>
      searchFields.some((field) => {
        const value = row[field];
        return (
          value &&
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    );
  }, [data, searchQuery, searchFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Handle sort
  const handleSort = useCallback((column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortColumn, sortDirection]);

  // Toggle expand
  const toggleExpand = useCallback((id: string | number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Desktop table view
  if (isDesktop || (!isMobile && !isTablet)) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        {searchable && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border rounded-lg dark:bg-charcoal-800 dark:border-charcoal-700"
            />
          </div>
        )}

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b dark:border-charcoal-700 bg-neutral-50 dark:bg-charcoal-800">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left font-semibold text-charcoal-900 dark:text-white ${
                    column.className || ''
                  }`}
                  style={{ width: column.width }}
                >
                  <button
                    onClick={() => column.sortable && handleSort(column.key)}
                    className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {column.label}
                    {column.sortable && (
                      <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  onClick={() => onRowClick?.(row)}
                  className="border-b dark:border-charcoal-700 hover:bg-neutral-50 dark:hover:bg-charcoal-800 cursor-pointer transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 text-charcoal-700 dark:text-charcoal-300 ${
                        column.className || ''
                      }`}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '')}
                    </td>
                  ))}
                </tr>
                {expandable && expandedRows.has(row.id) && expandedContent && (
                  <tr className="bg-neutral-50 dark:bg-charcoal-800">
                    <td colSpan={columns.length} className="px-4 py-4">
                      {expandedContent(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border dark:border-charcoal-700 hover:bg-neutral-50 dark:hover:bg-charcoal-800'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mobile/Tablet card view
  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border rounded-lg dark:bg-charcoal-800 dark:border-charcoal-700"
          />
        </div>
      )}

      {paginatedData.map((row) => (
        <div
          key={row.id}
          className="bg-white dark:bg-charcoal-800 rounded-lg border dark:border-charcoal-700 overflow-hidden"
        >
          <div
            onClick={() => {
              onRowClick?.(row);
              if (expandable) toggleExpand(row.id);
            }}
            className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors flex items-center justify-between"
          >
            <div className="space-y-2">
              {columns.slice(0, isMobile ? 1 : 2).map((column) => (
                <div
                  key={String(column.key)}
                  className="flex flex-col gap-1"
                >
                  <span className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">
                    {column.label}
                  </span>
                  <span className="text-charcoal-900 dark:text-white font-medium">
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '')}
                  </span>
                </div>
              ))}
            </div>
            {expandable && (
              <button
                onClick={() => toggleExpand(row.id)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
              >
                {expandedRows.has(row.id) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Expanded content */}
          {expandable && expandedRows.has(row.id) && expandedContent && (
            <div className="px-4 py-3 bg-neutral-50 dark:bg-charcoal-700 border-t dark:border-charcoal-600 space-y-3">
              {columns.slice(isMobile ? 1 : 2).map((column) => (
                <div key={String(column.key)}>
                  <span className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">
                    {column.label}
                  </span>
                  <span className="text-charcoal-900 dark:text-white font-medium block mt-1">
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '')}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t dark:border-charcoal-600">
                {expandedContent(row)}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'border dark:border-charcoal-700 hover:bg-neutral-50 dark:hover:bg-charcoal-800'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

ResponsiveTable.displayName = 'ResponsiveTable';
