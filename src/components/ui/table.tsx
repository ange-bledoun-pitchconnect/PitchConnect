/**
 * ============================================================================
 * TABLE COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade table primitives with charcoal/gold design system
 * 
 * @version 2.0.0
 * @path src/components/ui/table.tsx
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-lg border border-neutral-200 dark:border-charcoal-700">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-neutral-50 dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700 [&_tr]:border-b', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('bg-white dark:bg-charcoal-800 [&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('border-t bg-neutral-50 dark:bg-charcoal-800 font-medium [&>tr]:last:border-b-0', className)} {...props} />
  )
);
TableFooter.displayName = 'TableFooter';

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  hoverable?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-neutral-200 dark:border-charcoal-700 transition-colors',
        hoverable && 'hover:bg-neutral-50 dark:hover:bg-charcoal-700/50',
        selected && 'bg-gold-50 dark:bg-gold-900/20',
        className
      )}
      data-state={selected ? 'selected' : undefined}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortable, sorted, onSort, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold text-charcoal-700 dark:text-charcoal-300 [&:has([role=checkbox])]:pr-0',
        sortable && 'cursor-pointer select-none hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      {sortable ? (
        <div className="flex items-center gap-2">
          {children}
          {sorted === 'asc' && <ChevronUp className="h-4 w-4" />}
          {sorted === 'desc' && <ChevronDown className="h-4 w-4" />}
          {!sorted && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
        </div>
      ) : children}
    </th>
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle text-charcoal-900 dark:text-charcoal-100 [&:has([role=checkbox])]:pr-0', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-charcoal-600 dark:text-charcoal-400', className)} {...props} />
  )
);
TableCaption.displayName = 'TableCaption';

interface TableLoadingProps extends React.HTMLAttributes<HTMLTableRowElement> {
  columns: number;
  rows?: number;
}

const TableLoading = React.forwardRef<HTMLTableRowElement, TableLoadingProps>(
  ({ columns, rows = 5, ...props }, ref) => (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} ref={rowIndex === 0 ? ref : undefined} hoverable={false} {...props}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <div className="h-4 bg-neutral-200 dark:bg-charcoal-700 rounded animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
);
TableLoading.displayName = 'TableLoading';

interface TableEmptyProps extends React.HTMLAttributes<HTMLTableRowElement> {
  columns: number;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const TableEmpty = React.forwardRef<HTMLTableRowElement, TableEmptyProps>(
  ({ columns, icon, title = 'No data available', description = 'There are no records to display.', action, className, ...props }, ref) => (
    <TableRow ref={ref} hoverable={false} className={className} {...props}>
      <TableCell colSpan={columns} className="h-48">
        <div className="flex flex-col items-center justify-center text-center py-8">
          {icon || <Inbox className="h-12 w-12 text-charcoal-300 dark:text-charcoal-600 mb-4" />}
          <p className="text-lg font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">{title}</p>
          <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mb-4">{description}</p>
          {action}
        </div>
      </TableCell>
    </TableRow>
  )
);
TableEmpty.displayName = 'TableEmpty';

interface TableCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

const TableCheckbox = React.forwardRef<HTMLInputElement, TableCheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);
    React.useEffect(() => {
      if (internalRef.current) internalRef.current.indeterminate = indeterminate || false;
    }, [indeterminate]);

    return (
      <input
        ref={internalRef}
        type="checkbox"
        className={cn('h-4 w-4 rounded border-neutral-300 dark:border-charcoal-600 text-gold-600 focus:ring-gold-500 dark:bg-charcoal-700', className)}
        {...props}
      />
    );
  }
);
TableCheckbox.displayName = 'TableCheckbox';

interface TablePaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const TablePagination = React.forwardRef<HTMLDivElement, TablePaginationProps>(
  ({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100], className, ...props }, ref) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div ref={ref} className={cn('flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-charcoal-700', className)} {...props}>
        <div className="flex items-center gap-4">
          <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalItems}</span>
          </span>
          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="text-sm border border-neutral-300 dark:border-charcoal-600 rounded-md px-2 py-1 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white"
            >
              {pageSizeOptions.map((size) => <option key={size} value={size}>{size} per page</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium rounded-md border border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-charcoal-600 dark:text-charcoal-400">Page {currentPage} of {totalPages}</span>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium rounded-md border border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Next
          </button>
        </div>
      </div>
    );
  }
);
TablePagination.displayName = 'TablePagination';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableLoading,
  TableEmpty,
  TableCheckbox,
  TablePagination,
};