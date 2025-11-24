// src/app/dashboard/admin/layout.tsx
// SuperAdmin Layout with Sidebar Navigation

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Activity,
  Eye,
  Rss,
  Menu,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

// UPDATED: Reordered with Feed as #2
const NAV_ITEMS = [
  { href: '/dashboard/admin', label: 'System Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/feed', label: 'Feed', icon: Rss }, // NEW - #2 position
  { href: '/dashboard/admin/users', label: 'User Management', icon: Users },
  { href: '/dashboard/admin/impersonate', label: 'View as User', icon: Eye },
  { href: '/dashboard/admin/subscriptions', label: 'Subscriptions & Billing', icon: CreditCard },
  { href: '/dashboard/admin/financial', label: 'Financial Reports', icon: BarChart3 },
  { href: '/dashboard/admin/system', label: 'System & Logs', icon: Activity },
  { href: '/dashboard/admin/settings', label: 'Admin Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if user is SuperAdmin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      return;
    }

    if (status === 'authenticated' && !session?.user?.isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  // Handle mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-charcoal-900 to-black">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-white text-lg font-semibold">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-charcoal-900 to-black overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? (isMobile ? 'translate-x-0' : 'w-64') : isMobile ? '-translate-x-full' : 'w-20'
        } ${
          isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : ''
        } bg-charcoal-800 border-r border-charcoal-700 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-charcoal-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <p className="font-bold text-white text-sm">PitchConnect</p>
                <p className="text-xs text-gold-400">SuperAdmin</p>
              </div>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-charcoal-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                    isActive
                      ? 'bg-gold-500 text-charcoal-900'
                      : 'text-charcoal-300 hover:bg-charcoal-700 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-charcoal-900' : ''}`} />
                  {sidebarOpen && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">
                        {item.label}
                      </span>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {sidebarOpen && (
          <div className="border-t border-charcoal-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {session?.user?.name}
                </p>
                <p className="text-charcoal-400 text-xs truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Button (Desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-full h-12 border-t border-charcoal-700 text-charcoal-400 hover:text-gold-400 transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* AdminHeader with Notifications */}
        <AdminHeader />

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Button */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}