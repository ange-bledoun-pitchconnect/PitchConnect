/**
 * Data Table Component
 * Reusable table for displaying data with sorting, filtering, and pagination
 */

import { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: keyof T) => void;
  onRowClick?: (row: T) => void;
  selectedRows?: (string | number)[];
  onRowSelect?: (rowKey: string | number, isSelected: boolean) => void;
  showCheckbox?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
  sortBy,
  sortOrder = 'asc',
  onSort,
  onRowClick,
  selectedRows = [],
  onRowSelect,
  showCheckbox = false,
}: DataTableProps<T>) {
  const getSortIcon = (column: keyof T) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (isEmpty) {
    return (
      <div className="text-center p-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
        <p className="text-charcoal-600 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            {showCheckbox && (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={(e) => {
                    data.forEach((row, idx) => {
                      const key = keyExtractor(row, idx);
                      const isSelected = selectedRows.includes(key);
                      if (e.target.checked && !isSelected) {
                        onRowSelect?.(key, true);
                      } else if (!e.target.checked && isSelected) {
                        onRowSelect?.(key, false);
                      }
                    });
                  }}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-6 py-4 text-left text-xs font-bold text-charcoal-700 uppercase tracking-wider ${
                  column.width || ''
                } ${column.sortable ? 'cursor-pointer hover:bg-neutral-100' : ''}`}
                onClick={() => {
                  if (column.sortable && onSort) {
                    onSort(column.key);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length + (showCheckbox ? 1 : 0)}
                className="px-6 py-12 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gold-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gold-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gold-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowKey = keyExtractor(row, idx);
              const isSelected = selectedRows.includes(rowKey);
              const isEven = idx % 2 === 0;

              return (
                <tr
                  key={rowKey}
                  className={`transition-colors ${
                    isEven && striped ? 'bg-white' : striped ? 'bg-neutral-50/50' : 'bg-white'
                  } ${
                    hoverable
                      ? 'hover:bg-gold-50 cursor-pointer'
                      : ''
                  } ${isSelected ? 'bg-gold-100' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {showCheckbox && (
                    <td className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-neutral-300 text-gold-600 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onRowSelect?.(rowKey, e.target.checked);
                        }}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={`${rowKey}-${String(column.key)}`}
                      className="px-6 py-4 text-sm text-charcoal-900"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
