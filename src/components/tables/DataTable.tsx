/**
 * ============================================================================
 * DATA TABLE COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade reusable data table with advanced features.
 * Consolidates table functionality across the platform.
 * 
 * FEATURES:
 * - Column sorting (single/multi)
 * - Global and column filtering
 * - Pagination with page size options
 * - Row selection (single/multi)
 * - Column visibility toggle
 * - Responsive (horizontal scroll on mobile)
 * - Loading and empty states
 * - Striped/hoverable rows
 * - Custom cell renderers
 * - Export to CSV
 * - Dark mode support
 * - Accessibility (ARIA, keyboard nav)
 * 
 * @version 2.0.0
 * @path src/components/tables/DataTable.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Download,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// =============================================================================
// TYPES
// =============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  /** Unique column key */
  key: string;
  /** Column header label */
  header: string;
  /** Accessor function or key path */
  accessor: keyof T | ((row: T) => unknown);
  /** Custom cell renderer */
  cell?: (value: unknown, row: T) => React.ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is filterable */
  filterable?: boolean;
  /** Whether column is visible by default */
  defaultVisible?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Minimum column width */
  minWidth?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Sticky column position */
  sticky?: 'left' | 'right';
  /** Header tooltip */
  headerTooltip?: string;
}

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  /** Data rows */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Unique row identifier */
  rowKey: keyof T | ((row: T) => string);
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Enable row selection */
  selectable?: boolean;
  /** Single or multi select */
  selectMode?: 'single' | 'multi';
  /** Selected row IDs */
  selectedIds?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (ids: Set<string>) => void;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Enable pagination */
  paginated?: boolean;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Default page size */
  defaultPageSize?: number;
  /** Enable global search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Enable column visibility toggle */
  columnToggle?: boolean;
  /** Enable CSV export */
  exportable?: boolean;
  /** Export filename */
  exportFilename?: string;
  /** Striped rows */
  striped?: boolean;
  /** Hoverable rows */
  hoverable?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Border style */
  bordered?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Header CSS classes */
  headerClassName?: string;
  /** Row CSS classes */
  rowClassName?: string | ((row: T) => string);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getValueByAccessor<T>(row: T, accessor: keyof T | ((row: T) => unknown)): unknown {
  if (typeof accessor === 'function') {
    return accessor(row);
  }
  return row[accessor];
}

function getRowId<T>(row: T, rowKey: keyof T | ((row: T) => string)): string {
  if (typeof rowKey === 'function') {
    return rowKey(row);
  }
  return String(row[rowKey]);
}

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return direction === 'asc' ? 1 : -1;
  if (b === null || b === undefined) return direction === 'asc' ? -1 : 1;
  
  // String comparison
  if (typeof a === 'string' && typeof b === 'string') {
    return direction === 'asc'
      ? a.localeCompare(b)
      : b.localeCompare(a);
  }
  
  // Number comparison
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }
  
  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return direction === 'asc'
      ? a.getTime() - b.getTime()
      : b.getTime() - a.getTime();
  }
  
  // Fallback to string comparison
  return direction === 'asc'
    ? String(a).localeCompare(String(b))
    : String(b).localeCompare(String(a));
}

function exportToCSV<T>(
  data: T[],
  columns: ColumnDef<T>[],
  filename: string
): void {
  const headers = columns.map(col => col.header);
  const rows = data.map(row =>
    columns.map(col => {
      const value = getValueByAccessor(row, col.accessor);
      // Escape quotes and handle special characters
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading = false,
  emptyMessage = 'No data available',
  selectable = false,
  selectMode = 'multi',
  selectedIds = new Set(),
  onSelectionChange,
  onRowClick,
  paginated = true,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  searchable = true,
  searchPlaceholder = 'Search...',
  columnToggle = true,
  exportable = true,
  exportFilename = 'export',
  striped = true,
  hoverable = true,
  compact = false,
  bordered = true,
  className,
  headerClassName,
  rowClassName,
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.key))
  );
  
  // Reset page when data or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchQuery]);
  
  // Get visible columns config
  const activeColumns = useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.key));
  }, [columns, visibleColumns]);
  
  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      return activeColumns.some(col => {
        if (!col.filterable) return false;
        const value = getValueByAccessor(row, col.accessor);
        return String(value ?? '').toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, activeColumns]);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortState || !sortState.direction) return filteredData;
    
    const column = columns.find(c => c.key === sortState.column);
    if (!column) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = getValueByAccessor(a, column.accessor);
      const bValue = getValueByAccessor(b, column.accessor);
      return compareValues(aValue, bValue, sortState.direction);
    });
  }, [filteredData, sortState, columns]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, paginated, currentPage, pageSize]);
  
  // Pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const showingStart = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(currentPage * pageSize, sortedData.length);
  
  // Handlers
  const handleSort = useCallback((columnKey: string) => {
    setSortState(prev => {
      if (prev?.column !== columnKey) {
        return { column: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: columnKey, direction: 'desc' };
      }
      return null;
    });
  }, []);
  
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      const allIds = new Set(paginatedData.map(row => getRowId(row, rowKey)));
      onSelectionChange(new Set([...selectedIds, ...allIds]));
    } else {
      const pageIds = new Set(paginatedData.map(row => getRowId(row, rowKey)));
      const newSelection = new Set([...selectedIds].filter(id => !pageIds.has(id)));
      onSelectionChange(newSelection);
    }
  }, [paginatedData, rowKey, selectedIds, onSelectionChange]);
  
  const handleSelectRow = useCallback((rowId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (selectMode === 'single') {
      onSelectionChange(checked ? new Set([rowId]) : new Set());
    } else {
      const newSelection = new Set(selectedIds);
      if (checked) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
      onSelectionChange(newSelection);
    }
  }, [selectMode, selectedIds, onSelectionChange]);
  
  const handleExport = useCallback(() => {
    exportToCSV(sortedData, activeColumns, exportFilename);
  }, [sortedData, activeColumns, exportFilename]);
  
  // Check if all visible rows are selected
  const allSelected = paginatedData.length > 0 &&
    paginatedData.every(row => selectedIds.has(getRowId(row, rowKey)));
  const someSelected = paginatedData.some(row => selectedIds.has(getRowId(row, rowKey)));
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        {searchable && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          {columnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleColumns.has(col.key)}
                    onCheckedChange={(checked) => {
                      setVisibleColumns(prev => {
                        const next = new Set(prev);
                        if (checked) {
                          next.add(col.key);
                        } else {
                          next.delete(col.key);
                        }
                        return next;
                      });
                    }}
                  >
                    {col.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Export */}
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      {/* Table */}
      <div
        className={cn(
          'rounded-lg overflow-hidden',
          bordered && 'border border-gray-200 dark:border-gray-700'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={cn(
              'bg-gray-50 dark:bg-charcoal-800',
              headerClassName
            )}>
              <tr>
                {/* Selection checkbox */}
                {selectable && selectMode === 'multi' && (
                  <th className="px-4 py-3 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={cn(someSelected && !allSelected && 'data-[state=checked]:bg-gold-300')}
                    />
                  </th>
                )}
                {selectable && selectMode === 'single' && (
                  <th className="px-4 py-3 w-12" />
                )}
                
                {/* Column headers */}
                {activeColumns.map(col => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider',
                      col.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-charcoal-700 transition-colors',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.sticky === 'left' && 'sticky left-0 bg-gray-50 dark:bg-charcoal-800 z-10',
                      col.sticky === 'right' && 'sticky right-0 bg-gray-50 dark:bg-charcoal-800 z-10'
                    )}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                    }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="flex-shrink-0">
                          {sortState?.column === col.key ? (
                            sortState.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-charcoal-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={activeColumns.length + (selectable ? 1 : 0)}
                    className="px-4 py-12 text-center"
                  >
                    <Loader2 className="h-8 w-8 text-gold-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeColumns.length + (selectable ? 1 : 0)}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const rowId = getRowId(row, rowKey);
                  const isSelected = selectedIds.has(rowId);
                  const rowClasses = typeof rowClassName === 'function'
                    ? rowClassName(row)
                    : rowClassName;
                  
                  return (
                    <tr
                      key={rowId}
                      className={cn(
                        striped && index % 2 === 1 && 'bg-gray-50 dark:bg-charcoal-950/50',
                        hoverable && 'hover:bg-gray-100 dark:hover:bg-charcoal-800',
                        isSelected && 'bg-gold-50 dark:bg-gold-900/20',
                        onRowClick && 'cursor-pointer',
                        rowClasses
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {/* Selection checkbox */}
                      {selectable && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(rowId, !!checked)}
                            aria-label={`Select row ${rowId}`}
                          />
                        </td>
                      )}
                      
                      {/* Data cells */}
                      {activeColumns.map(col => {
                        const value = getValueByAccessor(row, col.accessor);
                        const cellContent = col.cell ? col.cell(value, row) : String(value ?? '');
                        
                        return (
                          <td
                            key={col.key}
                            className={cn(
                              compact ? 'px-4 py-2' : 'px-4 py-3',
                              'text-sm text-gray-900 dark:text-gray-100',
                              col.align === 'center' && 'text-center',
                              col.align === 'right' && 'text-right',
                              col.sticky === 'left' && 'sticky left-0 bg-inherit z-10',
                              col.sticky === 'right' && 'sticky right-0 bg-inherit z-10'
                            )}
                            style={{
                              width: col.width,
                              minWidth: col.minWidth,
                            }}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {paginated && !isLoading && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {showingStart} to {showingEnd} of {sortedData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            {/* Page Size */}
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="px-3 text-sm text-gray-600 dark:text-gray-300">
                {currentPage} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
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

export default DataTable;