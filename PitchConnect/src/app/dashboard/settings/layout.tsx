// ============================================================================
// FIX: src/app/dashboard/settings/layout.tsx
// Settings layout with "Back to Dashboard" button
// ============================================================================

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Bell, Lock, CreditCard } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface SettingsLayoutProps {
  children: ReactNode;
}

const SETTINGS_NAV = [
  { href: '/dashboard/settings/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/settings/security', label: 'Security', icon: Lock },
  { href: '/dashboard/settings/billing', label: 'Billing', icon: CreditCard },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Back to Dashboard Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-100 text-charcoal-700 rounded-lg border border-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Settings</h1>
          <p className="text-sm text-charcoal-600">Manage your account preferences</p>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex border-b border-neutral-200">
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-gold-500 text-gold-600 bg-gold-50'
                    : 'border-transparent text-charcoal-600 hover:text-charcoal-900 hover:bg-neutral-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}