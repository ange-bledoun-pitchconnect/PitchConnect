// src/app/dashboard/layout.tsx
'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeamFilterProvider } from '@/lib/dashboard/team-context';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // ⚠️ CRITICAL: Use useEffect + router.replace() instead of redirect()
  // This allows page.tsx router to work first
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 transition-colors duration-200">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-200 dark:border-gold-800 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal-600 dark:text-charcoal-400 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Check if user is SuperAdmin AND on superadmin route
  const isSuperAdmin = session?.user?.isSuperAdmin === true;
  const isOnSuperAdminRoute = pathname?.startsWith('/dashboard/superadmin');

  // ✅ FIXED: Only use minimal layout when SuperAdmin is on SuperAdmin route
  // The SuperAdmin layout will handle its own sidebar and header
  if (isSuperAdmin && isOnSuperAdminRoute) {
    return (
      <TeamFilterProvider>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 transition-colors duration-200">
          {children}
        </div>
      </TeamFilterProvider>
    );
  }

  // Check if on settings page
  const isSettingsPage = pathname?.startsWith('/dashboard/settings');

  // ✅ ALL OTHER ROUTES get full layout (overview, player, coach, manager, league-admin)
  return (
    <TeamFilterProvider>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 transition-colors duration-200">
        <div className="flex h-screen">
          {/* SIDEBAR - For all non-superadmin routes */}
          <DashboardSidebar userType={session?.user?.userType as string} />

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="bg-white dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700 shadow-sm sticky top-0 z-40 transition-colors duration-200">
              <div className="px-6 py-4 flex items-center justify-between">
                {/* Back button for settings pages */}
                <div className="flex items-center gap-4">
                  {isSettingsPage && (
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 bg-charcoal-100 dark:bg-charcoal-700 hover:bg-charcoal-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>
                  )}
                  <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">
                    {isSettingsPage ? 'Settings' : 'Dashboard'}
                  </h1>
                </div>
                <DashboardHeader />
              </div>
            </div>

            {/* PAGE CONTENT */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </TeamFilterProvider>
  );
}
