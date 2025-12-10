'use client';

/**
 * Responsive Table Component
 * - Transforms to cards on mobile
 * - Sticky headers for scrolling
 * - Collapsible columns on small screens
 * - Touch-optimized interactions
 * - Dark mode support
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';

// TYPES
export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  mobileHidden?: boolean; // Hide on mobile
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface ResponsiveTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

export default function ResponsiveTable<T = any>({
  columns,
  data,
  keyField,
  onRowClick,
  stickyHeader = true,
  striped = true,
  hoverable = true,
  className = ''
}: ResponsiveTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Toggle row expansion (mobile)
  const toggleRow = (rowKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  // Sort data
  const sortedData = sortColumn
    ? [...data].sort((a, b) => {
        const aValue = a[sortColumn as keyof T];
        const bValue = b[sortColumn as keyof T];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  // Get visible columns (excluding mobile-hidden)
  const mobileVisibleColumns = columns.filter(col => !col.mobileHidden);
  const primaryColumn = mobileVisibleColumns;

  return (
    <div className={`responsive-table-wrapper ${className}`}>
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
        <table className="w-full text-sm">
          {/* THEAD */}
          <thead
            className={`
              bg-neutral-50 dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700
              ${stickyHeader ? 'sticky top-0 z-10' : ''}
            `}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    text-left px-4 py-3 font-semibold text-charcoal-700 dark:text-charcoal-300 whitespace-nowrap
                    ${column.sortable ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors' : ''}
                    ${column.className || ''}
                  `}
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
            </tr>
          </thead>

          {/* TBODY */}
          <tbody className="divide-y divide-neutral-200 dark:divide-charcoal-700">
            {sortedData.map((row, index) => {
              const rowKey = (row as any)[keyField];

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-neutral-50 dark:bg-charcoal-800/50' : 'bg-white dark:bg-charcoal-800'}
                    ${hoverable ? 'hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-charcoal-900 dark:text-charcoal-100 ${column.className || ''}`}
                    >
                      {column.render
                        ? column.render((row as any)[column.key], row)
                        : (row as any)[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* EMPTY STATE */}
        {sortedData.length === 0 && (
          <div className="text-center py-12 text-charcoal-500 dark:text-charcoal-400">
            <p className="text-lg font-semibold mb-2">No data available</p>
            <p className="text-sm">There are no records to display.</p>
          </div>
        )}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {sortedData.map((row) => {
          const rowKey = (row as any)[keyField];
          const isExpanded = expandedRows.has(rowKey);

          return (
            <div
              key={rowKey}
              className="bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-lg shadow-sm overflow-hidden"
            >
              {/* PRIMARY ROW (Always Visible) */}
              <div
                onClick={() => onRowClick ? onRowClick(row) : toggleRow(rowKey)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-charcoal-900 dark:text-white mb-1">
                    {primaryColumn.render
                      ? primaryColumn.render((row as any)[primaryColumn.key], row)
                      : (row as any)[primaryColumn.key]}
                  </div>
                  {/* Show 2nd column as subtitle if exists */}
                  {mobileVisibleColumns && (
                    <div className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      {mobileVisibleColumns.render
                        ? mobileVisibleColumns.render((row as any)[mobileVisibleColumns.key], row)
                        : (row as any)[mobileVisibleColumns.key]}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(rowKey);
                  }}
                  className="ml-4 p-2 text-charcoal-600 dark:text-charcoal-400 hover:bg-neutral-100 dark:hover:bg-charcoal-600 rounded-lg transition-colors"
                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* EXPANDED DETAILS */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-neutral-200 dark:border-charcoal-700 space-y-3 animate-in slide-in-from-top duration-200">
                  {mobileVisibleColumns.slice(2).map((column) => (
                    <div key={column.key} className="flex justify-between items-start gap-4">
                      <span className="text-sm font-medium text-charcoal-600 dark:text-charcoal-400 flex-shrink-0">
                        {column.label}:
                      </span>
                      <span className="text-sm text-charcoal-900 dark:text-white text-right">
                        {column.render
                          ? column.render((row as any)[column.key], row)
                          : (row as any)[column.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* EMPTY STATE */}
        {sortedData.length === 0 && (
          <div className="text-center py-12 text-charcoal-500 dark:text-charcoal-400 bg-white dark:bg-charcoal-800 rounded-lg border border-neutral-200 dark:border-charcoal-700">
            <p className="text-lg font-semibold mb-2">No data available</p>
            <p className="text-sm">There are no records to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// EXAMPLE BADGE COMPONENT (for status rendering)
export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[status] || colors.INACTIVE
      } ${className}`}
    >
      {status}
    </span>
  );
}
