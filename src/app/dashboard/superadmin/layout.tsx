// src/app/dashboard/superadmin/layout.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeamFilterProvider } from '@/lib/dashboard/team-context';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ============================================================================
  // SECURITY: Verify SuperAdmin Access
  // ============================================================================
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session?.user && !session.user.isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [status, session, router]);

  // ============================================================================
  // RESPONSIVE: Handle mobile sidebar
  // ============================================================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================================
  // NAVIGATION: SuperAdmin menu items
  // ============================================================================
  const navItems = [
    { label: 'Overview', href: '/dashboard/superadmin', icon: '📊' },
    { label: 'Users', href: '/dashboard/superadmin/users', icon: '👥' },
    { label: 'Subscriptions', href: '/dashboard/superadmin/subscriptions', icon: '💳' },
    { label: 'Payments', href: '/dashboard/superadmin/payments', icon: '💰' },
    { label: 'Analytics', href: '/dashboard/superadmin/analytics', icon: '📈' },
    { label: 'Audit Logs', href: '/dashboard/superadmin/audit-logs', icon: '📋' },
    { label: 'System Settings', href: '/dashboard/superadmin/system', icon: '⚙️' },
  ];

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-gold-50 dark:from-charcoal-900 dark:to-charcoal-800">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-gold-200 dark:border-gold-700 border-t-gold-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-charcoal-600 dark:text-charcoal-400 font-semibold">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTH CHECK
  // ============================================================================
  if (!session?.user?.isSuperAdmin) {
    return null;
  }

  // ============================================================================
  // RENDER: SuperAdmin Layout
  // ============================================================================
  return (
    <TeamFilterProvider>
      <div className="flex h-screen bg-neutral-50 dark:bg-charcoal-900 transition-colors duration-200">
        {/* ======================================================================
            SIDEBAR
            ====================================================================== */}
        <aside
          className={clsx(
            'fixed md:relative z-40 h-full bg-white dark:bg-charcoal-800 border-r border-neutral-200 dark:border-charcoal-700 shadow-lg md:shadow-sm transition-transform duration-300 ease-in-out',
            isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
            'w-64'
          )}
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700 bg-gradient-to-br from-gold-50 dark:from-charcoal-700 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-orange-500 bg-clip-text text-transparent">
                PitchConnect
              </h1>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors md:hidden"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
                </button>
              )}
            </div>
            <p className="text-sm font-semibold text-gold-600 dark:text-gold-400 uppercase tracking-wide">
              SuperAdmin
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-2 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard/superadmin' 
                ? pathname === item.href 
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-gold-500 to-orange-400 text-white font-semibold shadow-md'
                      : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-gold-50 dark:hover:bg-charcoal-700 group-hover:text-gold-600'
                  )}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1 h-6 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-neutral-200 dark:border-charcoal-700 bg-neutral-50 dark:bg-charcoal-700">
            <div className="mb-4 p-3 bg-gold-50 dark:bg-gold-900/20 rounded-lg">
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold mb-1">
                Logged in as
              </p>
              <p className="text-sm font-bold text-charcoal-900 dark:text-white truncate">
                {session?.user?.email}
              </p>
              <p className="text-xs text-gold-600 dark:text-gold-400 font-semibold mt-1">
                🔒 SuperAdmin Access
              </p>
            </div>

            <button
              onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ======================================================================
            MAIN CONTENT AREA
            ====================================================================== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ✅ TOP HEADER WITH ROLE SWITCHER AND ACTIONS */}
          <header className="bg-white dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700 shadow-sm sticky top-0 z-40 transition-colors duration-200">
            <div className="px-6 py-4 flex items-center justify-between">
              {/* Left side - Mobile menu toggle + Title */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="w-6 h-6 text-charcoal-600 dark:text-charcoal-400" />
                </button>
                <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">
                  Dashboard
                </h1>
              </div>
              
              {/* Right side - Role Switcher + Notifications + Settings + Profile */}
              <DashboardHeader />
            </div>
          </header>

          {/* Mobile sidebar backdrop */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          {/* Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Breadcrumb navigation */}
              <div className="hidden md:flex items-center gap-2 text-sm text-charcoal-600 dark:text-charcoal-400 mb-6">
                <Link
                  href="/dashboard"
                  className="hover:text-gold-600 transition-colors"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-charcoal-900 dark:text-white font-medium">
                  SuperAdmin
                </span>
                {pathname !== '/dashboard/superadmin' && (
                  <>
                    <span>/</span>
                    <span className="text-gold-600 font-medium">
                      {pathname
                        .split('/')
                        .pop()
                        ?.replace('-', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </>
                )}
              </div>

              {/* Page Content */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </TeamFilterProvider>
  );
}
