/**
 * ============================================================================
 * DataTable Component
 * ============================================================================
 * 
 * Enterprise-grade data table with sorting, pagination, filtering, and
 * row selection.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - All users with table views
 * 
 * FEATURES:
 * - Client-side sorting (multi-column)
 * - Pagination with page size options
 * - Row selection (single/multi)
 * - Column visibility toggle
 * - Search/filter
 * - Loading skeleton
 * - Empty state
 * - Sticky header
 * - Export to CSV
 * - Dark mode support
 * - Responsive design
 * - Accessible (ARIA labels)
 * 
 * ============================================================================
 */

'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
  Settings2,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface DataTableColumn<T> {
  /** Column ID/key */
  id: string;
  /** Header label */
  header: string;
  /** Accessor function or key */
  accessor: keyof T | ((row: T) => ReactNode);
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Column width */
  width?: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Hide by default */
  hidden?: boolean;
  /** Cell renderer */
  cell?: (row: T, value: unknown) => ReactNode;
  /** Enable filtering */
  filterable?: boolean;
}

export interface DataTableProps<T extends { id: string | number }> {
  /** Table columns configuration */
  columns: DataTableColumn<T>[];
  /** Table data */
  data: T[];
  /** Items per page */
  pageSize?: number;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Enable row selection */
  selectable?: boolean;
  /** Selection mode */
  selectionMode?: 'single' | 'multi';
  /** Selected row IDs */
  selectedIds?: (string | number)[];
  /** Selection change callback */
  onSelectionChange?: (ids: (string | number)[]) => void;
  /** Row click callback */
  onRowClick?: (row: T) => void;
  /** Enable search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Enable column visibility toggle */
  columnToggle?: boolean;
  /** Enable export */
  exportable?: boolean;
  /** Export filename */
  exportFilename?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Custom class name */
  className?: string;
  /** Table caption for accessibility */
  caption?: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get cell value from row
 */
function getCellValue<T>(row: T, accessor: keyof T | ((row: T) => ReactNode)): unknown {
  if (typeof accessor === 'function') {
    return accessor(row);
  }
  return row[accessor];
}

/**
 * Compare values for sorting
 */
function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  let result = 0;

  if (typeof a === 'string' && typeof b === 'string') {
    result = a.localeCompare(b);
  } else if (typeof a === 'number' && typeof b === 'number') {
    result = a - b;
  } else if (a instanceof Date && b instanceof Date) {
    result = a.getTime() - b.getTime();
  } else {
    result = String(a).localeCompare(String(b));
  }

  return direction === 'desc' ? -result : result;
}

/**
 * Export data to CSV
 */
function exportToCSV<T>(
  data: T[],
  columns: DataTableColumn<T>[],
  filename: string
): void {
  const visibleColumns = columns.filter((col) => !col.hidden);
  
  const headers = visibleColumns.map((col) => col.header);
  const rows = data.map((row) =>
    visibleColumns.map((col) => {
      const value = getCellValue(row, col.accessor);
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  loading = false,
  emptyMessage = 'No data available',
  selectable = false,
  selectionMode = 'multi',
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Search...',
  columnToggle = false,
  exportable = false,
  exportFilename = 'export',
  stickyHeader = false,
  className,
  caption,
}: DataTableProps<T>) {
  // State
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    new Set(columns.filter((c) => c.hidden).map((c) => c.id))
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Visible columns
  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumns.has(col.id)),
    [columns, hiddenColumns]
  );

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      visibleColumns.some((col) => {
        const value = getCellValue(row, col.accessor);
        return String(value ?? '').toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, visibleColumns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredData;

    const column = columns.find((c) => c.id === sort.column);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getCellValue(a, column.accessor);
      const bValue = getCellValue(b, column.accessor);
      return compareValues(aValue, bValue, sort.direction);
    });
  }, [filteredData, sort, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Total pages
  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = useCallback((columnId: string) => {
    setSort((prev) => {
      if (prev.column !== columnId) {
        return { column: columnId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: columnId, direction: 'desc' };
      }
      return { column: null, direction: null };
    });
  }, []);

  // Handle row selection
  const handleSelectRow = useCallback(
    (id: string | number) => {
      if (!onSelectionChange) return;

      if (selectionMode === 'single') {
        onSelectionChange(selectedIds.includes(id) ? [] : [id]);
      } else {
        onSelectionChange(
          selectedIds.includes(id)
            ? selectedIds.filter((i) => i !== id)
            : [...selectedIds, id]
        );
      }
    },
    [selectedIds, selectionMode, onSelectionChange]
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    if (selectedIds.length === paginatedData.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(paginatedData.map((row) => row.id));
    }
  }, [selectedIds, paginatedData, onSelectionChange]);

  // Toggle column visibility
  const toggleColumn = useCallback((columnId: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Sort icon
  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sort.column !== columnId) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 rounded-lg p-6', className)}>
        <TableSkeleton columns={visibleColumns.length} />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 rounded-lg p-12 text-center', className)}>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Column Toggle */}
          {columnToggle && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Columns
              </Button>
              {showColumnMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  {columns.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => toggleColumn(col.id)}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {hiddenColumns.has(col.id) ? (
                        <X className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {col.header}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export */}
          {exportable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(sortedData, visibleColumns, exportFilename)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full" role="grid" aria-label={caption}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead
            className={cn(
              'bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {/* Select All */}
              {selectable && selectionMode === 'multi' && (
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 &&
                      selectedIds.length === paginatedData.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {/* Column Headers */}
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.align !== 'center' && col.align !== 'right' && 'text-left'
                  )}
                  style={{ width: col.width }}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.id)}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      {col.header}
                      <SortIcon columnId={col.id} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-gray-200 dark:border-gray-700 transition-colors',
                  rowIndex % 2 === 0
                    ? 'bg-white dark:bg-transparent'
                    : 'bg-gray-50/50 dark:bg-gray-900/30',
                  'hover:bg-gray-100 dark:hover:bg-gray-800/50',
                  onRowClick && 'cursor-pointer',
                  selectedIds.includes(row.id) && 'bg-primary/5 dark:bg-primary/10'
                )}
              >
                {/* Row Checkbox */}
                {selectable && selectionMode === 'multi' && (
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300"
                      aria-label={`Select row ${row.id}`}
                    />
                  </td>
                )}

                {/* Cells */}
                {visibleColumns.map((col) => {
                  const value = getCellValue(row, col.accessor);
                  return (
                    <td
                      key={col.id}
                      className={cn(
                        'px-6 py-4 text-sm text-gray-900 dark:text-gray-100',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.cell ? col.cell(row, value) : (value as ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Page Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
          </div>

          {/* Info */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </p>

          {/* Page Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-w-[36px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

DataTable.displayName = 'DataTable';

export default DataTable;
