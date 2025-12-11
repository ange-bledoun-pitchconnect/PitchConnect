'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean; // Hide on mobile
  tabletHidden?: boolean; // Hide on tablet
}

interface ResponsiveTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchFields?: (keyof T)[];
  filterable?: boolean;
  sortable?: boolean;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
  pagination?: {
    enabled: boolean;
    pageSize: number;
  };
  onRowClick?: (row: T, index: number) => void;
  expandable?: boolean;
  expandableContent?: (row: T, index: number) => React.ReactNode;
  loading?: boolean;
  empty?: React.ReactNode;
  className?: string;
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc';
}

// ============================================================================
// RESPONSIVE TABLE COMPONENT
// ============================================================================

export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  searchable = false,
  searchFields = [],
  filterable = false,
  sortable = true,
  striped = true,
  hover = true,
  compact = false,
  pagination = { enabled: false, pageSize: 10 },
  onRowClick,
  expandable = false,
  expandableContent,
  loading = false,
  empty,
  className = '',
}: ResponsiveTableProps<T>) {
  // ============================================================================
  // HOOKS
  // ============================================================================

  const { isMobile, isTablet, isDesktop } = useResponsive();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // ============================================================================
  // FILTERING & SEARCHING
  // ============================================================================

  const filteredData = useMemo(() => {
    if (!searchQuery || !searchable) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      return searchFields.some((field) => {
        const value = row[field];
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchable, searchFields]);

  // ============================================================================
  // SORTING
  // ============================================================================

  const sortedData = useMemo(() => {
    if (!sortable || !sortState.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortState.key as keyof T];
      const bValue = b[sortState.key as keyof T];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortState.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortState.direction === 'asc' ? -1 : 1;

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortState.direction === 'asc' ? comparison : -comparison;
      }

      // Default
      return 0;
    });
  }, [filteredData, sortState, sortable]);

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const paginatedData = useMemo(() => {
    if (!pagination.enabled) return sortedData;

    const start = (currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pagination]);

  const totalPages = pagination.enabled ? Math.ceil(sortedData.length / pagination.pageSize) : 1;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSort = useCallback((key: string) => {
    setSortState((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const toggleExpandRow = useCallback((index: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // ============================================================================
  // RESPONSIVE VIEW SELECTION
  // ============================================================================

  // On mobile, show card view
  if (isMobile) {
    return <MobileCardView data={paginatedData} columns={columns} onRowClick={onRowClick} />;
  }

  // On tablet, show collapsible rows
  if (isTablet) {
    return (
      <TabletView
        data={paginatedData}
        columns={columns}
        searchable={searchable}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        expandable={expandable}
        expandableContent={expandableContent}
        expandedRows={expandedRows}
        onToggleExpand={toggleExpandRow}
      />
    );
  }

  // On desktop, show full featured table
  return (
    <DesktopView
      columns={columns}
      data={paginatedData}
      searchable={searchable}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      sortable={sortable}
      sortState={sortState}
      onSort={handleSort}
      striped={striped}
      hover={hover}
      compact={compact}
      onRowClick={onRowClick}
      expandable={expandable}
      expandableContent={expandableContent}
      expandedRows={expandedRows}
      onToggleExpand={toggleExpandRow}
      pagination={pagination}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}

// ============================================================================
// DESKTOP VIEW - FULL FEATURED TABLE
// ============================================================================

interface DesktopViewProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortable: boolean;
  sortState: SortState;
  onSort: (key: string) => void;
  striped: boolean;
  hover: boolean;
  compact: boolean;
  onRowClick?: (row: T, index: number) => void;
  expandable: boolean;
  expandableContent?: (row: T, index: number) => React.ReactNode;
  expandedRows: Set<number>;
  onToggleExpand: (index: number) => void;
  pagination: { enabled: boolean; pageSize: number };
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function DesktopView<T extends Record<string, any>>({
  columns,
  data,
  searchable,
  searchQuery,
  onSearchChange,
  sortable,
  sortState,
  onSort,
  striped,
  hover,
  compact,
  onRowClick,
  expandable,
  expandableContent,
  expandedRows,
  onToggleExpand,
  pagination,
  currentPage,
  totalPages,
  onPageChange,
}: DesktopViewProps<T>) {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* SEARCH BAR */}
      {searchable && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800">
          <Search size={18} className="text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-charcoal-700 shadow-sm">
        <table className="w-full">
          {/* TABLE HEADER */}
          <thead>
            <tr className="bg-gray-50 dark:bg-charcoal-800 border-b border-gray-200 dark:border-charcoal-700">
              {expandable && (
                <th className="px-4 py-3 text-left w-12">
                  <span className="sr-only">Expand</span>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`
                    px-4 py-3 text-left font-semibold text-sm text-charcoal-800 dark:text-gray-200
                    ${col.width ? `w-${col.width}` : ''}
                    ${sortable && col.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-charcoal-700' : ''}
                    ${col.mobileHidden ? 'hidden md:table-cell' : ''}
                    ${col.tabletHidden ? 'hidden lg:table-cell' : ''}
                    transition-colors duration-200
                  `}
                  onClick={() => sortable && col.sortable && onSort(String(col.key))}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {sortable && col.sortable && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortState.key === col.key ? (
                          sortState.direction === 'asc' ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        ) : (
                          <ChevronDown size={16} className="opacity-30" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (expandable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {/* DATA ROW */}
                  <tr
                    className={`
                      border-b border-gray-200 dark:border-charcoal-700
                      ${striped && rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-charcoal-900/30' : 'bg-white dark:bg-charcoal-900'}
                      ${hover && onRowClick ? 'hover:bg-gold/5 dark:hover:bg-gold/5 cursor-pointer' : ''}
                      transition-colors duration-150
                    `}
                    onClick={() => onRowClick?.(row, rowIndex)}
                  >
                    {/* EXPAND BUTTON */}
                    {expandable && (
                      <td className="px-4 py-3 w-12">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(rowIndex);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded transition-colors"
                        >
                          {expandedRows.has(rowIndex) ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </td>
                    )}

                    {/* DATA CELLS */}
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={`
                          px-4 py-3 text-sm text-charcoal-700 dark:text-gray-300
                          ${col.mobileHidden ? 'hidden md:table-cell' : ''}
                          ${col.tabletHidden ? 'hidden lg:table-cell' : ''}
                          ${col.className || ''}
                        `}
                      >
                        {col.render
                          ? col.render(row[col.key], row, rowIndex)
                          : String(row[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>

                  {/* EXPANDABLE ROW */}
                  {expandable && expandedRows.has(rowIndex) && (
                    <tr className="bg-gray-50 dark:bg-charcoal-900/50 border-b border-gold/20">
                      <td colSpan={columns.length + 1} className="px-4 py-4">
                        {expandableContent?.(row, rowIndex)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination.enabled && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 dark:border-charcoal-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 dark:border-charcoal-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TABLET VIEW - COLLAPSIBLE ROWS
// ============================================================================

interface TabletViewProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  expandable: boolean;
  expandableContent?: (row: T, index: number) => React.ReactNode;
  expandedRows: Set<number>;
  onToggleExpand: (index: number) => void;
}

function TabletView<T extends Record<string, any>>({
  data,
  columns,
  searchable,
  searchQuery,
  onSearchChange,
  expandable,
  expandableContent,
  expandedRows,
  onToggleExpand,
}: TabletViewProps<T>) {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* SEARCH BAR */}
      {searchable && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-charcoal-700">
          <Search size={18} className="text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      )}

      {/* CARD LIST */}
      <div className="space-y-3">
        {data.map((row, rowIndex) => {
          // Get visible columns (not tabletHidden)
          const visibleColumns = columns.filter((col) => !col.tabletHidden);

          return (
            <div
              key={rowIndex}
              className="border border-gray-200 dark:border-charcoal-700 rounded-lg overflow-hidden"
            >
              {/* CARD HEADER - MAIN DATA */}
              <div
                className="bg-white dark:bg-charcoal-800 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-charcoal-700 transition-colors"
                onClick={() => expandable && onToggleExpand(rowIndex)}
              >
                <div className="flex-1">
                  {visibleColumns.slice(0, 2).map((col) => (
                    <div key={String(col.key)} className="mb-1">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {col.label}
                      </span>
                      <p className="text-sm text-charcoal-800 dark:text-white font-medium">
                        {col.render
                          ? col.render(row[col.key], row, rowIndex)
                          : String(row[col.key] ?? '-')}
                      </p>
                    </div>
                  ))}
                </div>
                {expandable && (
                  <button className="p-2 ml-2">
                    {expandedRows.has(rowIndex) ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                )}
              </div>

              {/* CARD BODY - EXPANDABLE DETAILS */}
              {expandable && expandedRows.has(rowIndex) && (
                <div className="bg-gray-50 dark:bg-charcoal-900/50 p-4 border-t border-gray-200 dark:border-charcoal-700">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {visibleColumns.slice(2).map((col) => (
                      <div key={String(col.key)}>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {col.label}
                        </span>
                        <p className="text-sm text-charcoal-800 dark:text-white mt-1">
                          {col.render
                            ? col.render(row[col.key], row, rowIndex)
                            : String(row[col.key] ?? '-')}
                        </p>
                      </div>
                    ))}
                  </div>
                  {expandableContent && (
                    <div className="border-t border-gray-200 dark:border-charcoal-700 pt-4">
                      {expandableContent(row, rowIndex)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MOBILE VIEW - CARD LAYOUT
// ============================================================================

interface MobileCardViewProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T, index: number) => void;
}

function MobileCardView<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
}: MobileCardViewProps<T>) {
  // Get only the first 2-3 columns for mobile display
  const visibleColumns = columns.filter((col) => !col.mobileHidden).slice(0, 3);

  return (
    <div className="w-full space-y-3 p-4">
      {data.map((row, rowIndex) => (
        <div
          key={rowIndex}
          onClick={() => onRowClick?.(row, rowIndex)}
          className={`
            bg-white dark:bg-charcoal-800
            border border-gray-200 dark:border-charcoal-700
            rounded-lg p-4
            ${onRowClick ? 'cursor-pointer active:bg-gray-50 dark:active:bg-charcoal-700' : ''}
            transition-colors duration-150
          `}
        >
          {visibleColumns.map((col) => (
            <div key={String(col.key)} className="mb-2 last:mb-0">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {col.label}
              </span>
              <p className="text-sm font-medium text-charcoal-800 dark:text-white mt-1">
                {col.render
                  ? col.render(row[col.key], row, rowIndex)
                  : String(row[col.key] ?? '-')}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default ResponsiveTable;
