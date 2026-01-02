/**
 * ============================================================================
 * Responsive Table Component
 * ============================================================================
 * 
 * Enterprise-grade responsive table with multi-view support.
 * Adapts to desktop (table), tablet (expandable), mobile (cards).
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/mobile/ResponsiveTable.tsx
 * 
 * FEATURES:
 * - Desktop: Standard table view
 * - Tablet: Expandable rows
 * - Mobile: Card-based layout
 * - Sortable columns
 * - Pagination
 * - Search/filter support
 * - Row selection
 * - Custom renderers
 * - Dark mode support
 * - Accessibility compliant
 * 
 * AFFECTED USER ROLES:
 * All roles - used for data tables throughout the application
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useResponsive } from '@/hooks/useResponsive';

// =============================================================================
// TYPES
// =============================================================================

export interface Column<T> {
  /** Column key (must match data property) */
  key: keyof T;
  /** Display label */
  label: string;
  /** Short label for mobile */
  shortLabel?: string;
  /** Enable sorting */
  sortable?: boolean;
  /** Column width */
  width?: string;
  /** Custom render function */
  render?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
  /** Cell class name */
  className?: string;
  /** Header class name */
  headerClassName?: string;
  /** Hide on mobile */
  hideOnMobile?: boolean;
  /** Hide on tablet */
  hideOnTablet?: boolean;
  /** Align content */
  align?: 'left' | 'center' | 'right';
}

export interface ResponsiveTableProps<T extends { id: string | number }> {
  /** Column definitions */
  columns: Column<T>[];
  /** Table data */
  data: T[];
  /** Rows per page */
  rowsPerPage?: number;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Enable expandable rows */
  expandable?: boolean;
  /** Expanded content renderer */
  expandedContent?: (row: T) => React.ReactNode;
  /** Enable search */
  searchable?: boolean;
  /** Fields to search */
  searchFields?: (keyof T)[];
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row IDs */
  selectedIds?: (string | number)[];
  /** Selection change handler */
  onSelectionChange?: (ids: (string | number)[]) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom class name */
  className?: string;
  /** Table variant */
  variant?: 'default' | 'striped' | 'bordered';
  /** Compact mode */
  compact?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ResponsiveTable<T extends { id: string | number }>({
  columns,
  data,
  rowsPerPage = 10,
  onRowClick,
  expandable = false,
  expandedContent,
  searchable = false,
  searchFields = [],
  searchPlaceholder = 'Search...',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  loading = false,
  emptyMessage = 'No data available',
  className,
  variant = 'default',
  compact = false,
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery || searchFields.length === 0) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      searchFields.some((field) => {
        const value = row[field];
        return value && String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, sortedData.length);

  // Handle sort
  const handleSort = useCallback((column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortColumn]);

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

  // Toggle row selection
  const toggleRowSelection = useCallback(
    (id: string | number) => {
      if (!onSelectionChange) return;

      const newSelectedIds = selectedIds.includes(id)
        ? selectedIds.filter((sid) => sid !== id)
        : [...selectedIds, id];

      onSelectionChange(newSelectedIds);
    },
    [selectedIds, onSelectionChange]
  );

  // Toggle all selection
  const toggleAllSelection = useCallback(() => {
    if (!onSelectionChange) return;

    const allIds = paginatedData.map((row) => row.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !allIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...allIds])]);
    }
  }, [paginatedData, selectedIds, onSelectionChange]);

  // Get visible columns based on device
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      if (isMobile && col.hideOnMobile) return false;
      if (isTablet && col.hideOnTablet) return false;
      return true;
    });
  }, [columns, isMobile, isTablet]);

  // Variant styles
  const variantStyles = {
    default: '',
    striped: '[&_tbody_tr:nth-child(odd)]:bg-neutral-50 dark:[&_tbody_tr:nth-child(odd)]:bg-charcoal-800/50',
    bordered: '[&_th]:border [&_td]:border border-neutral-200 dark:border-charcoal-700',
  };

  // =========================================================================
  // DESKTOP TABLE VIEW
  // =========================================================================
  const renderDesktopTable = () => (
    <div className="overflow-x-auto">
      <table className={cn(
        'w-full border-collapse',
        variantStyles[variant]
      )}>
        <thead>
          <tr className="border-b border-neutral-200 dark:border-charcoal-700 bg-neutral-50 dark:bg-charcoal-800">
            {selectable && (
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={paginatedData.length > 0 && paginatedData.every((row) => selectedIds.includes(row.id))}
                  onCheckedChange={toggleAllSelection}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {visibleColumns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-4 py-3 text-left font-semibold text-charcoal-900 dark:text-white',
                  compact && 'py-2 text-sm',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.headerClassName
                )}
                style={{ width: column.width }}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    {column.label}
                    {sortColumn === column.key ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-40" />
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
            {expandable && <th className="w-12" />}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <React.Fragment key={row.id}>
              <tr
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-neutral-100 dark:border-charcoal-700 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-800',
                  selectedIds.includes(row.id) && 'bg-primary/5'
                )}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => toggleRowSelection(row.id)}
                      aria-label={`Select row ${row.id}`}
                    />
                  </td>
                )}
                {visibleColumns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn(
                      'px-4 py-3 text-charcoal-700 dark:text-charcoal-300',
                      compact && 'py-2 text-sm',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : String(row[column.key] ?? '')}
                  </td>
                ))}
                {expandable && (
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(row.id);
                      }}
                      className="p-1 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded transition-colors"
                    >
                      {expandedRows.has(row.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                )}
              </tr>
              {expandable && expandedRows.has(row.id) && expandedContent && (
                <tr className="bg-neutral-50 dark:bg-charcoal-800">
                  <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + 1} className="px-4 py-4">
                    {expandedContent(row)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  // =========================================================================
  // MOBILE/TABLET CARD VIEW
  // =========================================================================
  const renderCardView = () => (
    <div className="space-y-3">
      {paginatedData.map((row, rowIndex) => (
        <div
          key={row.id}
          className={cn(
            'bg-white dark:bg-charcoal-800 rounded-lg border border-neutral-200 dark:border-charcoal-700 overflow-hidden',
            selectedIds.includes(row.id) && 'ring-2 ring-primary'
          )}
        >
          <div
            onClick={() => {
              onRowClick?.(row);
              if (expandable) toggleExpand(row.id);
            }}
            className={cn(
              'p-4 transition-colors',
              (onRowClick || expandable) && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              {selectable && (
                <Checkbox
                  checked={selectedIds.includes(row.id)}
                  onCheckedChange={() => toggleRowSelection(row.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
              )}
              <div className="flex-1 space-y-2">
                {/* Primary columns (first 2) */}
                {visibleColumns.slice(0, 2).map((column) => (
                  <div key={String(column.key)} className="flex flex-col">
                    <span className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">
                      {column.shortLabel || column.label}
                    </span>
                    <span className="text-charcoal-900 dark:text-white font-medium">
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : String(row[column.key] ?? '')}
                    </span>
                  </div>
                ))}
              </div>
              {expandable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(row.id);
                  }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
                >
                  {expandedRows.has(row.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Expanded content */}
          {expandedRows.has(row.id) && (
            <div className="px-4 pb-4 pt-2 border-t border-neutral-100 dark:border-charcoal-700 space-y-3">
              {/* Remaining columns */}
              {visibleColumns.slice(2).map((column) => (
                <div key={String(column.key)}>
                  <span className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase">
                    {column.shortLabel || column.label}
                  </span>
                  <span className="block text-charcoal-900 dark:text-white font-medium mt-0.5">
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : String(row[column.key] ?? '')}
                  </span>
                </div>
              ))}
              {expandedContent && (
                <div className="pt-3 border-t border-neutral-100 dark:border-charcoal-700">
                  {expandedContent(row)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      )}

      {/* Table/Cards */}
      {loading ? (
        <div className="py-12 text-center text-charcoal-500">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading...
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="py-12 text-center text-charcoal-500">
          {emptyMessage}
        </div>
      ) : isDesktop ? (
        renderDesktopTable()
      ) : (
        renderCardView()
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-charcoal-700">
          <p className="text-sm text-charcoal-500">
            Showing {startIndex} to {endIndex} of {sortedData.length} results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

ResponsiveTable.displayName = 'ResponsiveTable';

export default ResponsiveTable;
