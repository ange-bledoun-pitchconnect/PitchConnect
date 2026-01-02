/**
 * ============================================================================
 * Mobile Navigation Components Bundle
 * ============================================================================
 * 
 * Role-based mobile navigation with responsive layouts.
 * 
 * @version 2.0.0
 * @path src/components/mobile/index.tsx
 * 
 * COMPONENTS:
 * - MobileNav: Role-based mobile navigation
 * - ResponsiveTable: Adaptive table component
 * 
 * FEATURES:
 * - Role-based navigation items
 * - Hamburger menu (mobile)
 * - Bottom navigation (tablet)
 * - Sidebar (desktop)
 * - Touch-friendly (44px targets)
 * - Badge support
 * - Dark mode
 * 
 * ============================================================================
 */

'use client';

import { useState, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  BarChart3,
  Search,
  Users,
  Trophy,
  Settings,
  Calendar,
  FileText,
  Shield,
  Briefcase,
  Heart,
  UserCog,
  CreditCard,
  Flag,
  Video,
  Target,
  Clipboard,
  type LucideIcon,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import { type UserRole } from '@/config/user-roles-config';

// =============================================================================
// TYPES
// =============================================================================

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  roles?: UserRole[];
  children?: Omit<NavItem, 'children'>[];
}

export interface MobileNavProps {
  /** Current user role */
  userRole: UserRole;
  /** App name */
  appName?: string;
  /** Logo URL */
  logoUrl?: string;
  /** Custom nav items override */
  customNavItems?: NavItem[];
  /** Unread notifications count */
  notificationCount?: number;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// NAVIGATION ITEMS BY ROLE
// =============================================================================

const BASE_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: Home, roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'TREASURER', 'REFEREE', 'SCOUT', 'ANALYST', 'PARENT', 'GUARDIAN', 'MEDICAL_STAFF', 'MEDIA_MANAGER', 'FAN', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'] },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar, roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'REFEREE', 'PARENT', 'GUARDIAN'] },
  { href: '/dashboard/matches', label: 'Matches', icon: Trophy, roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'REFEREE', 'ANALYST', 'FAN', 'MEDIA_MANAGER'] },
  { href: '/dashboard/training', label: 'Training', icon: Target, roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER'] },
  { href: '/dashboard/players', label: 'Players', icon: Users, roles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'SCOUT', 'ANALYST', 'MEDICAL_STAFF'] },
  { href: '/dashboard/teams', label: 'Teams', icon: Shield, roles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'] },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, roles: ['COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'] },
  { href: '/dashboard/medical', label: 'Medical', icon: Heart, roles: ['MEDICAL_STAFF', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER'] },
  { href: '/dashboard/scouting', label: 'Scouting', icon: Search, roles: ['SCOUT', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER'] },
  { href: '/dashboard/media', label: 'Media', icon: Video, roles: ['MEDIA_MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER'] },
  { href: '/dashboard/finance', label: 'Finance', icon: CreditCard, roles: ['TREASURER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'] },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText, roles: ['COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'] },
  { href: '/dashboard/fixtures', label: 'Fixtures', icon: Clipboard, roles: ['REFEREE', 'LEAGUE_ADMIN'] },
  { href: '/dashboard/leagues', label: 'Leagues', icon: Flag, roles: ['LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'] },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase, roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER', 'MEDICAL_STAFF', 'ANALYST', 'SCOUT'] },
  { href: '/dashboard/users', label: 'Users', icon: UserCog, roles: ['ADMIN', 'SUPERADMIN'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'TREASURER', 'REFEREE', 'SCOUT', 'ANALYST', 'PARENT', 'GUARDIAN', 'MEDICAL_STAFF', 'MEDIA_MANAGER', 'FAN', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'] },
];

// =============================================================================
// MOBILE NAV COMPONENT
// =============================================================================

export function MobileNav({
  userRole,
  appName = 'PitchConnect',
  logoUrl,
  customNavItems,
  notificationCount = 0,
  className,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const pathname = usePathname();

  const handleClose = useCallback(() => setIsOpen(false), []);

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + '/'),
    [pathname]
  );

  // Filter nav items by role
  const navItems = useMemo(() => {
    const items = customNavItems || BASE_NAV_ITEMS;
    return items.filter((item) => !item.roles || item.roles.includes(userRole));
  }, [customNavItems, userRole]);

  // Mobile: Hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Header */}
        <div className={cn('sticky top-0 z-40 bg-white dark:bg-charcoal-800 border-b dark:border-charcoal-700 flex items-center justify-between px-4 h-16', className)}>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-8 w-8 rounded-lg" />
            ) : (
              <div className="h-8 w-8 bg-gradient-to-br from-gold-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
            )}
            <h1 className="text-lg font-bold text-charcoal-900 dark:text-white">{appName}</h1>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Overlay */}
        {isOpen && <div className="fixed inset-0 bg-black/50 z-30" onClick={handleClose} />}

        {/* Drawer */}
        <div
          className={cn(
            'fixed left-0 top-16 bottom-0 w-72 bg-white dark:bg-charcoal-800 shadow-xl z-40 transform transition-transform overflow-y-auto',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]',
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </>
    );
  }

  // Tablet: Bottom navigation (top 5 items + more)
  if (isTablet) {
    const visibleItems = navItems.slice(0, 4);
    const moreItems = navItems.slice(4);

    return (
      <nav className={cn('fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-charcoal-800 border-t dark:border-charcoal-700 flex items-center justify-around px-2 h-16 safe-area-pb', className)}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] min-h-[44px] justify-center relative',
                active ? 'text-primary' : 'text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-0 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
        {/* More menu */}
        {moreItems.length > 0 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex flex-col items-center gap-1 px-3 py-2 text-charcoal-600 dark:text-charcoal-400 min-w-[60px] min-h-[44px] justify-center"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        )}

        {/* More dropdown */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={handleClose} />
            <div className="absolute bottom-full right-2 mb-2 w-56 bg-white dark:bg-charcoal-800 rounded-lg shadow-xl border dark:border-charcoal-700 z-40 max-h-80 overflow-y-auto">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors',
                      active ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-charcoal-700'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    );
  }

  // Desktop: Sidebar
  return (
    <aside className={cn('w-64 bg-white dark:bg-charcoal-800 border-r dark:border-charcoal-700 flex flex-col h-screen sticky top-0', className)}>
      {/* Logo */}
      <div className="p-4 border-b dark:border-charcoal-700">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="h-10 w-10 rounded-lg" />
          ) : (
            <div className="h-10 w-10 bg-gradient-to-br from-gold-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">PC</span>
            </div>
          )}
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">{appName}</h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

MobileNav.displayName = 'MobileNav';

// =============================================================================
// RESPONSIVE TABLE
// =============================================================================

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
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
  emptyMessage?: string;
}

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
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  // Filter
  const filteredData = useMemo(() => {
    if (!searchQuery || searchFields.length === 0) return data;
    return data.filter((row) =>
      searchFields.some((field) => {
        const value = row[field];
        return value && String(value).toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, searchQuery, searchFields]);

  // Sort
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

  // Paginate
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleSort = useCallback((column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortColumn, sortDirection]);

  const toggleExpand = useCallback((id: string | number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Visible columns based on screen size
  const visibleColumns = useMemo(() => {
    if (isDesktop) return columns;
    return columns.filter((col) => !col.hideOnMobile);
  }, [columns, isDesktop]);

  // Mobile: Card view
  if (isMobile || isTablet) {
    return (
      <div className={cn('space-y-4', className)}>
        {searchable && (
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2 border rounded-lg dark:bg-charcoal-800 dark:border-charcoal-700"
          />
        )}

        {paginatedData.length === 0 ? (
          <div className="text-center py-8 text-charcoal-500">{emptyMessage}</div>
        ) : (
          paginatedData.map((row) => (
            <div key={row.id} className="bg-white dark:bg-charcoal-800 rounded-lg border dark:border-charcoal-700 overflow-hidden">
              <div
                onClick={() => { onRowClick?.(row); if (expandable) toggleExpand(row.id); }}
                className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors"
              >
                <div className="space-y-2">
                  {visibleColumns.map((column) => (
                    <div key={String(column.key)} className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-charcoal-500 uppercase">{column.label}</span>
                      <span className="text-charcoal-900 dark:text-white font-medium">
                        {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                      </span>
                    </div>
                  ))}
                </div>
                {expandable && (
                  <div className="mt-2 flex justify-center">
                    {expandedRows.has(row.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                )}
              </div>
              {expandable && expandedRows.has(row.id) && expandedContent && (
                <div className="px-4 py-3 bg-neutral-50 dark:bg-charcoal-700 border-t dark:border-charcoal-600">
                  {expandedContent(row)}
                </div>
              )}
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'px-3 py-1 rounded text-sm',
                  currentPage === page ? 'bg-primary text-white' : 'border dark:border-charcoal-700 hover:bg-neutral-100 dark:hover:bg-charcoal-800'
                )}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Table view
  return (
    <div className={cn('overflow-x-auto', className)}>
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2 border rounded-lg dark:bg-charcoal-800 dark:border-charcoal-700"
          />
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b dark:border-charcoal-700 bg-neutral-50 dark:bg-charcoal-800">
            {visibleColumns.map((column) => (
              <th key={String(column.key)} className={cn('px-4 py-3 text-left font-semibold text-charcoal-900 dark:text-white', column.className)} style={{ width: column.width }}>
                {column.sortable ? (
                  <button onClick={() => handleSort(column.key)} className="flex items-center gap-2 hover:text-primary">
                    {column.label}
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  </button>
                ) : column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-charcoal-500">{emptyMessage}</td>
            </tr>
          ) : (
            paginatedData.map((row) => (
              <Fragment key={row.id}>
                <tr
                  onClick={() => onRowClick?.(row)}
                  className={cn('border-b dark:border-charcoal-700 hover:bg-neutral-50 dark:hover:bg-charcoal-800 transition-colors', onRowClick && 'cursor-pointer')}
                >
                  {visibleColumns.map((column) => (
                    <td key={String(column.key)} className={cn('px-4 py-3 text-charcoal-700 dark:text-charcoal-300', column.className)}>
                      {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                    </td>
                  ))}
                </tr>
                {expandable && expandedRows.has(row.id) && expandedContent && (
                  <tr className="bg-neutral-50 dark:bg-charcoal-800">
                    <td colSpan={visibleColumns.length} className="px-4 py-4">{expandedContent(row)}</td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn('px-3 py-1 rounded', currentPage === page ? 'bg-primary text-white' : 'border dark:border-charcoal-700 hover:bg-neutral-100 dark:hover:bg-charcoal-800')}
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

// =============================================================================
// EXPORTS
// =============================================================================

export default { MobileNav, ResponsiveTable };
