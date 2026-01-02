/**
 * ============================================================================
 * RESPONSIVE TABLE - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade responsive table with:
 * - Desktop table view with sorting
 * - Mobile card view with expansion
 * - Sticky headers
 * - Row selection
 * - Custom cell renderers
 * - Loading and empty states
 * - Pagination support
 * - Dark mode support
 * 
 * BUG FIX: Mobile view now correctly handles primaryColumn/secondaryColumn
 * 
 * @version 2.0.0
 * @path src/components/ui/ResponsiveTable.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Search,
  Filter,
  Loader2,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface Column<T = Record<string, unknown>> {
  /** Unique key for the column */
  key: string;
  /** Display label for header */
  label: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Hide on mobile devices */
  mobileHidden?: boolean;
  /** Priority for mobile view (lower = shown first) */
  mobilePriority?: number;
  /** Custom cell renderer */
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  /** Column header className */
  headerClassName?: string;
  /** Column cell className */
  cellClassName?: string;
  /** Column width */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sticky */
  sticky?: 'left' | 'right';
}

export interface ResponsiveTableProps<T = Record<string, unknown>> {
  /** Column definitions */
  columns: Column<T>[];
  /** Data rows */
  data: T[];
  /** Unique key field in data */
  keyField: string;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Enable sticky header */
  stickyHeader?: boolean;
  /** Enable striped rows */
  striped?: boolean;
  /** Enable hover effect */
  hoverable?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Additional className */
  className?: string;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Enable pagination */
  paginated?: boolean;
  /** Items per page */
  pageSize?: number;
  /** Current page (controlled) */
  currentPage?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Total items (for server-side pagination) */
  totalItems?: number;
  /** Enable global search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Row actions renderer */
  renderRowActions?: (row: T) => React.ReactNode;
}

type SortDirection = 'asc' | 'desc' | null;

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    // General statuses
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    // Training statuses
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    IN_PROGRESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    POSTPONED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    // Match statuses
    LIVE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse',
    UPCOMING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    FINISHED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    // Request statuses
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    WITHDRAWN: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const colorClass = statusColors[status.toUpperCase()] || statusColors.INACTIVE;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-charcoal-700">
      <div className="text-sm text-charcoal-600 dark:text-charcoal-400">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <span className="px-3 py-1 text-sm font-medium text-charcoal-700 dark:text-charcoal-300">
          {currentPage} / {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  stickyHeader = true,
  striped = true,
  hoverable = true,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyDescription = 'There are no records to display.',
  className = '',
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  paginated = false,
  pageSize = 10,
  currentPage: controlledPage,
  onPageChange: controlledOnPageChange,
  totalItems: controlledTotalItems,
  searchable = false,
  searchPlaceholder = 'Search...',
  renderRowActions,
}: ResponsiveTableProps<T>) {
  // State
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [internalPage, setInternalPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Controlled vs uncontrolled pagination
  const currentPage = controlledPage ?? internalPage;
  const onPageChange = controlledOnPageChange ?? setInternalPage;

  // Get visible columns for mobile
  const mobileVisibleColumns = useMemo(() => {
    return columns
      .filter(col => !col.mobileHidden)
      .sort((a, b) => (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99));
  }, [columns]);

  // FIX: Correctly extract primary and secondary columns
  const primaryColumn = mobileVisibleColumns[0];
  const secondaryColumn = mobileVisibleColumns[1];
  const expandedColumns = mobileVisibleColumns.slice(2);

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const totalItems = controlledTotalItems ?? sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const paginatedData = useMemo(() => {
    if (!paginated || controlledTotalItems !== undefined) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, paginated, currentPage, pageSize, controlledTotalItems]);

  // Handlers
  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const toggleRow = useCallback((rowKey: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  }, []);

  const toggleSelection = useCallback((rowKey: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(rowKey)) {
      next.delete(rowKey);
    } else {
      next.add(rowKey);
    }
    onSelectionChange(next);
  }, [selectedKeys, onSelectionChange]);

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    const allKeys = paginatedData.map(row => String(row[keyField]));
    const allSelected = allKeys.every(key => selectedKeys.has(key));
    
    if (allSelected) {
      const next = new Set(selectedKeys);
      allKeys.forEach(key => next.delete(key));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedKeys);
      allKeys.forEach(key => next.add(key));
      onSelectionChange(next);
    }
  }, [paginatedData, keyField, selectedKeys, onSelectionChange]);

  // Render cell value
  const renderCellValue = (column: Column<T>, row: T, index: number) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row, index);
    }
    if (value == null) return '-';
    return String(value);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border border-neutral-200 dark:border-charcoal-700', className)}>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('responsive-table-wrapper', className)}>
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600 transition-colors"
            />
          </div>
        </div>
      )}

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
        <table className="w-full text-sm">
          <thead
            className={cn(
              'bg-neutral-50 dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(row => selectedKeys.has(String(row[keyField])))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 dark:border-charcoal-600 text-gold-600 focus:ring-gold-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'text-left px-4 py-3 font-semibold text-charcoal-700 dark:text-charcoal-300 whitespace-nowrap',
                    column.sortable && 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.headerClassName
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                  role={column.sortable ? 'button' : undefined}
                  tabIndex={column.sortable ? 0 : undefined}
                  aria-sort={
                    sortColumn === column.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {renderRowActions && (
                <th className="w-12 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-200 dark:divide-charcoal-700">
            {paginatedData.map((row, index) => {
              const rowKey = String(row[keyField]);
              const isSelected = selectedKeys.has(rowKey);

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    striped && index % 2 === 1 ? 'bg-neutral-50 dark:bg-charcoal-800/50' : 'bg-white dark:bg-charcoal-800',
                    hoverable && 'hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-gold-50 dark:bg-gold-900/20'
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(rowKey)}
                        className="w-4 h-4 rounded border-neutral-300 dark:border-charcoal-600 text-gold-600 focus:ring-gold-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-charcoal-900 dark:text-charcoal-100',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.cellClassName
                      )}
                    >
                      {renderCellValue(column, row, index)}
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {renderRowActions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {paginatedData.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-charcoal-800">
            <Inbox className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
              {emptyMessage}
            </p>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
              {emptyDescription}
            </p>
          </div>
        )}

        {/* Pagination */}
        {paginated && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        )}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {paginatedData.map((row, index) => {
          const rowKey = String(row[keyField]);
          const isExpanded = expandedRows.has(rowKey);
          const isSelected = selectedKeys.has(rowKey);

          return (
            <div
              key={rowKey}
              className={cn(
                'bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-lg shadow-sm overflow-hidden',
                isSelected && 'ring-2 ring-gold-500'
              )}
            >
              {/* Primary Row (Always Visible) */}
              <div
                onClick={() => onRowClick ? onRowClick(row) : toggleRow(rowKey)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors"
              >
                {selectable && (
                  <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(rowKey)}
                      className="w-4 h-4 rounded border-neutral-300 dark:border-charcoal-600 text-gold-600 focus:ring-gold-500"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Primary Column - FIX APPLIED */}
                  {primaryColumn && (
                    <div className="font-semibold text-charcoal-900 dark:text-white mb-1 truncate">
                      {renderCellValue(primaryColumn, row, index)}
                    </div>
                  )}
                  
                  {/* Secondary Column - FIX APPLIED */}
                  {secondaryColumn && (
                    <div className="text-sm text-charcoal-600 dark:text-charcoal-400 truncate">
                      {renderCellValue(secondaryColumn, row, index)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {renderRowActions && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {renderRowActions(row)}
                    </div>
                  )}
                  
                  {expandedColumns.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(rowKey);
                      }}
                      className="p-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-neutral-100 dark:hover:bg-charcoal-600 rounded-lg transition-colors"
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details - FIX APPLIED */}
              {isExpanded && expandedColumns.length > 0 && (
                <div className="px-4 pb-4 pt-2 border-t border-neutral-200 dark:border-charcoal-700 space-y-3 animate-in slide-in-from-top duration-200">
                  {expandedColumns.map((column) => (
                    <div key={column.key} className="flex justify-between items-start gap-4">
                      <span className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400 flex-shrink-0">
                        {column.label}:
                      </span>
                      <span className="text-sm text-charcoal-900 dark:text-white text-right">
                        {renderCellValue(column, row, index)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {paginatedData.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-charcoal-800 rounded-lg border border-neutral-200 dark:border-charcoal-700">
            <Inbox className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
              {emptyMessage}
            </p>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
              {emptyDescription}
            </p>
          </div>
        )}

        {/* Mobile Pagination */}
        {paginated && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-charcoal-800 rounded-lg border border-neutral-200 dark:border-charcoal-700">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ResponsiveTable };