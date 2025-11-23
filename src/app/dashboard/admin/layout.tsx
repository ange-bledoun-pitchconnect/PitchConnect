// src/app/dashboard/admin/layout.tsx
// SuperAdmin Layout with Sidebar Navigation

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Eye,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'User Management', icon: Users },
  { href: '/dashboard/admin/subscriptions', label: 'Subscriptions & Billing', icon: CreditCard },
  { href: '/dashboard/admin/financial', label: 'Financial Reports', icon: BarChart3 },
  { href: '/dashboard/admin/system', label: 'System & Logs', icon: Activity },
  { href: '/dashboard/admin/impersonate', label: 'View as User', icon: Eye },
  { href: '/dashboard/admin/settings', label: 'Admin Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-charcoal-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-white text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-charcoal-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-charcoal-800 border-r border-charcoal-700 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-charcoal-700">
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
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal-300 hover:bg-charcoal-700 hover:text-gold-400 transition-colors group">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-charcoal-700 p-4 space-y-3">
          {sidebarOpen && (
            <div className="text-xs">
              <p className="text-charcoal-400">Logged in as</p>
              <p className="text-white font-semibold truncate">{session?.user?.name}</p>
              <p className="text-charcoal-500 text-xs truncate">{session?.user?.email}</p>
            </div>
          )}
          <Button
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            variant="outline"
            className="w-full border-red-900 text-red-400 hover:bg-red-950"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && 'Exit Admin'}
          </Button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex items-center justify-center w-full h-12 border-t border-charcoal-700 text-charcoal-400 hover:text-gold-400 transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-charcoal-800 border-b border-charcoal-700 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">Admin Dashboard</p>
            <p className="text-charcoal-400 text-sm">
              Welcome back, {session?.user?.name?.split(' ')[0]}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-950 border border-green-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-400">System Online</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Admin Warning Banner */}
            <div className="mb-6 p-4 bg-yellow-950 border border-yellow-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-200">
                  You are in SuperAdmin mode
                </p>
                <p className="text-xs text-yellow-300 mt-1">
                  All actions are logged and monitored. Exercise caution when modifying user data or system settings.
                </p>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-gold-600"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}
    </div>
  );
}