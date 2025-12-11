'use client';

import { useResponsive } from '@/hooks/useResponsive';
import { MobileNav } from '@/components/mobile/mobile-nav';
import { DashboardNav } from '@/components/dashboard/nav';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      {/* Navigation */}
      {isMobile ? (
        <MobileNav />
      ) : (
        <aside className="hidden sm:block w-64 bg-white dark:bg-charcoal-800 border-r">
          <DashboardNav />
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav (if needed) */}
      {isTablet && (
        <nav className="border-t sm:hidden sticky bottom-0 bg-white dark:bg-charcoal-800">
          {/* Bottom navigation items */}
        </nav>
      )}
    </div>
  );
}
