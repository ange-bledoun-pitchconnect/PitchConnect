// src/app/dashboard/superadmin/layout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/dashboard/superadmin', icon: '📊' },
    { label: 'Users', href: '/dashboard/superadmin/users', icon: '👥' },
    { label: 'Subscriptions', href: '/dashboard/superadmin/subscriptions', icon: '💳' },
    { label: 'Payments', href: '/dashboard/superadmin/payments', icon: '💰' },
    { label: 'Analytics', href: '/dashboard/superadmin/analytics', icon: '📈' },
    { label: 'Audit Logs', href: '/dashboard/superadmin/audit-logs', icon: '📋' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-charcoal-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-charcoal-800 border-r border-gray-200 dark:border-charcoal-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-charcoal-700">
          <h1 className="text-2xl font-bold text-gold">SuperAdmin</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">PitchConnect</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-gold text-white font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-700'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}