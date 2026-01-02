/**
 * ============================================================================
 * Layout Components Bundle
 * ============================================================================
 * 
 * Reusable layout components for consistent page structure.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/layout/index.tsx
 * 
 * COMPONENTS:
 * - MainNav: Primary navigation with role-based visibility
 * - PageHeader: Page title, description, breadcrumbs, actions
 * - PageContainer: Consistent page wrapper
 * - MainLayout: Full page layout with sidebar
 * 
 * ============================================================================
 */

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X, ChevronRight, Home, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type UserRole } from '@/config/user-roles-config';
import { type Sport } from '@/config/sport-dashboard-config';
import { DashboardSidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';

// =============================================================================
// MAIN NAV COMPONENT
// =============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  requiresAuth?: boolean;
  allowedRoles?: UserRole[];
  isExternal?: boolean;
  badge?: string | number;
}

export interface MainNavProps {
  items: NavItem[];
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export function MainNav({ items, className, variant = 'horizontal' }: MainNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Get user roles
  const userRoles = ((session?.user as any)?.roles as UserRole[]) || [];

  // Filter visible items based on auth and roles
  const visibleItems = items.filter((item) => {
    if (item.requiresAuth && !session) return false;
    if (item.allowedRoles?.length && !item.allowedRoles.some((r) => userRoles.includes(r))) {
      return false;
    }
    return true;
  });

  // Check if path is active
  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Toggle mobile menu
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Horizontal variant (desktop)
  if (variant === 'horizontal') {
    return (
      <nav className={cn('relative', className)}>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.isExternal ? '_blank' : undefined}
              rel={item.isExternal ? 'noopener noreferrer' : undefined}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-charcoal-600 dark:text-charcoal-300 hover:text-primary hover:bg-primary/5'
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          type="button"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-charcoal-800 rounded-xl shadow-xl border border-neutral-200 dark:border-charcoal-700 overflow-hidden md:hidden z-50">
            <div className="flex flex-col py-2">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    'px-4 py-3 font-medium text-sm transition-all flex items-center gap-2',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700'
                  )}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    );
  }

  // Vertical variant
  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-3',
            isActive(item.href)
              ? 'bg-primary/10 text-primary'
              : 'text-charcoal-600 dark:text-charcoal-300 hover:text-primary hover:bg-primary/5'
          )}
          aria-current={isActive(item.href) ? 'page' : undefined}
        >
          {item.icon && <span aria-hidden="true">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="px-1.5 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
              {item.badge}
            </span>
          )}
          {isActive(item.href) && <ChevronRight className="w-4 h-4" />}
        </Link>
      ))}
    </nav>
  );
}

MainNav.displayName = 'MainNav';

// =============================================================================
// PAGE HEADER COMPONENT
// =============================================================================

export interface Breadcrumb {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Badge element */
  badge?: ReactNode;
  /** Action buttons */
  actions?: ReactNode;
  /** Breadcrumbs */
  breadcrumbs?: Breadcrumb[];
  /** Show back button */
  showBack?: boolean;
  /** Back button URL */
  backHref?: string;
  /** Custom class name */
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  showBack = false,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/dashboard"
                className="text-charcoal-500 dark:text-charcoal-400 hover:text-primary transition-colors"
              >
                <Home className="w-4 h-4" />
              </Link>
            </li>
            {breadcrumbs.map((crumb, idx) => {
              const Icon = crumb.icon;
              return (
                <li key={idx} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-charcoal-400" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-charcoal-500 dark:text-charcoal-400 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-charcoal-900 dark:text-white font-medium flex items-center gap-1">
                      {Icon && <Icon className="w-4 h-4" />}
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Back Button */}
          {showBack && backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-sm text-charcoal-500 dark:text-charcoal-400 hover:text-primary mb-2 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </Link>
          )}

          {/* Title with Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-charcoal-900 dark:text-white">
              {title}
            </h1>
            {badge}
          </div>

          {/* Description */}
          {description && (
            <p className="mt-2 text-charcoal-600 dark:text-charcoal-400 text-base lg:text-lg max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

PageHeader.displayName = 'PageHeader';

// =============================================================================
// PAGE CONTAINER COMPONENT
// =============================================================================

export interface PageContainerProps {
  /** Page content */
  children: ReactNode;
  /** Max width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Center content */
  centered?: boolean;
  /** Custom class name */
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = '7xl',
  padding = 'md',
  centered = false,
  className,
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '7xl': 'max-w-[1400px]',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-4',
    md: 'px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
    lg: 'px-4 sm:px-6 lg:px-8 py-8 lg:py-12',
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-neutral-50 dark:bg-charcoal-900',
        paddingClasses[padding],
        className
      )}
    >
      <div
        className={cn(
          maxWidthClasses[maxWidth],
          centered && 'mx-auto',
          !centered && 'ml-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}

PageContainer.displayName = 'PageContainer';

// =============================================================================
// MAIN LAYOUT COMPONENT
// =============================================================================

export interface MainLayoutProps {
  /** Page content */
  children: ReactNode;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Show header */
  showHeader?: boolean;
  /** Current sport context */
  sport?: Sport;
  /** Sidebar collapsed state */
  sidebarCollapsed?: boolean;
  /** Sidebar collapsed change handler */
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  /** Custom class name */
  className?: string;
}

export function MainLayout({
  children,
  showSidebar = true,
  showHeader = true,
  sport,
  sidebarCollapsed,
  onSidebarCollapsedChange,
  className,
}: MainLayoutProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = sidebarCollapsed ?? internalCollapsed;
  const setCollapsed = onSidebarCollapsedChange ?? setInternalCollapsed;

  return (
    <div className={cn('flex h-screen bg-neutral-50 dark:bg-charcoal-900', className)}>
      {/* Sidebar */}
      {showSidebar && (
        <DashboardSidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          sport={sport}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        {showHeader && (
          <DashboardHeader
            sport={sport}
            showSportSelector={!!sport}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

MainLayout.displayName = 'MainLayout';

// =============================================================================
// SECTION COMPONENT
// =============================================================================

export interface SectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Section content */
  children: ReactNode;
  /** Action buttons */
  actions?: ReactNode;
  /** Add padding */
  padded?: boolean;
  /** Add border */
  bordered?: boolean;
  /** Custom class name */
  className?: string;
}

export function Section({
  title,
  description,
  children,
  actions,
  padded = false,
  bordered = false,
  className,
}: SectionProps) {
  return (
    <section
      className={cn(
        bordered && 'border border-neutral-200 dark:border-charcoal-700 rounded-xl bg-white dark:bg-charcoal-800',
        padded && 'p-6',
        className
      )}
    >
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {title && (
              <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

Section.displayName = 'Section';

// =============================================================================
// CARD GRID COMPONENT
// =============================================================================

export interface CardGridProps {
  /** Grid content */
  children: ReactNode;
  /** Number of columns */
  columns?: 1 | 2 | 3 | 4;
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

export function CardGrid({
  children,
  columns = 3,
  gap = 'md',
  className,
}: CardGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 lg:gap-6',
    lg: 'gap-6 lg:gap-8',
  };

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

CardGrid.displayName = 'CardGrid';

// =============================================================================
// EXPORTS
// =============================================================================

export { DashboardSidebar } from './Sidebar';
export { DashboardHeader } from './DashboardHeader';

export default {
  MainNav,
  PageHeader,
  PageContainer,
  MainLayout,
  Section,
  CardGrid,
  DashboardSidebar,
  DashboardHeader,
};
