'use client';

/**
 * Mobile Navigation Component
 * Path: src/components/mobile/mobile-nav.tsx
 * 
 * Features:
 * - Hamburger menu (mobile)
 * - Bottom navigation (tablet)
 * - Full nav (desktop)
 * - Touch-friendly tap targets (44px)
 * - Smooth transitions
 * - Active state indicators
 */

import { useState, useCallback } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
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
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
  { href: '/dashboard/analytics-advanced', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { href: '/dashboard/search', label: 'Search', icon: <Search className="w-5 h-5" /> },
  { href: '/dashboard/players', label: 'Players', icon: <Users className="w-5 h-5" /> },
  { href: '/dashboard/standings', label: 'Standings', icon: <Trophy className="w-5 h-5" /> },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const pathname = usePathname();

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href),
    [pathname]
  );

  // Mobile: Hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-charcoal-800 border-b dark:border-charcoal-700 flex items-center justify-between px-4 py-3 h-16">
          <h1 className="text-lg font-bold text-charcoal-900 dark:text-white">
            PitchConnect
          </h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={handleClose}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-charcoal-800 shadow-lg z-40 transform transition-transform ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </>
    );
  }

  // Tablet: Bottom navigation
  if (isTablet) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-charcoal-800 border-t dark:border-charcoal-700 flex items-center justify-around px-2 py-2 h-20 sm:h-24">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[44px] h-[44px] justify-center ${
              isActive(item.href)
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-charcoal-200'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium text-center">{item.label}</span>
            {item.badge && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    );
  }

  // Desktop: Sidebar navigation
  return (
    <aside className="w-64 bg-white dark:bg-charcoal-800 border-r dark:border-charcoal-700 p-4">
      <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white mb-8">
        PitchConnect
      </h2>
      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

MobileNav.displayName = 'MobileNav';
