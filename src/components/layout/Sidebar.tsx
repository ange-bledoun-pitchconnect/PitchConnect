'use client';

/**
 * Enhanced Sidebar Component
 * - Mobile-first responsive navigation
 * - Smooth transitions for collapse/expand
 * - Touch-optimized interactions
 * - Role-based menu items
 * - Dark mode support
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-authreact';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, Users, Trophy, Calendar, BarChart3, Settings, 
  Menu, X, ChevronRight, Shield, Dumbbell, FileText,
  Award, Video, Bell, LogOut, User
} from 'lucide-react';

// TYPES
interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: string;
  submenu?: MenuItem[];
}

// MENU CONFIGURATION
const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-5 h-5" />,
    roles: ['ALL']
  },
  {
    label: 'My Teams',
    href: '/dashboard/teams',
    icon: <Users className="w-5 h-5" />,
    roles: ['PLAYER', 'COACH', 'CLUBMANAGER', 'CLUBOWNER']
  },
  {
    label: 'Matches',
    href: '/dashboard/matches',
    icon: <Trophy className="w-5 h-5" />,
    roles: ['ALL']
  },
  {
    label: 'Training',
    href: '/dashboard/training',
    icon: <Dumbbell className="w-5 h-5" />,
    roles: ['PLAYER', 'COACH']
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['COACH', 'CLUBMANAGER', 'ANALYST']
  },
  {
    label: 'Leagues',
    href: '/dashboard/leagues',
    icon: <Award className="w-5 h-5" />,
    roles: ['LEAGUEADMIN', 'CLUBMANAGER']
  },
  {
    label: 'Videos',
    href: '/dashboard/videos',
    icon: <Video className="w-5 h-5" />,
    roles: ['ALL']
  },
  {
    label: 'Schedule',
    href: '/dashboard/schedule',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['ALL']
  }
];

export default function DashboardSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  // Filter menu items based on user role
  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.roles.includes('ALL')) return true;
    return session?.user?.roles?.some((role: string) => item.roles.includes(role));
  });

  // Check if menu item is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-lg shadow-lg hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-all duration-200"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-charcoal-900 dark:text-white" />
        ) : (
          <Menu className="w-6 h-6 text-charcoal-900 dark:text-white" />
        )}
      </button>

      {/* OVERLAY (Mobile only) */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-charcoal-800 border-r border-neutral-200 dark:border-charcoal-700 z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* LOGO/BRAND */}
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 group"
            onClick={() => isMobile && setIsOpen(false)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal-900 dark:text-white">
                PitchConnect
              </h1>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                Sports Management
              </p>
            </div>
          </Link>
        </div>

        {/* USER INFO */}
        {session?.user && (
          <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                {session.user.avatar ? (
                  <img 
                    src={session.user.avatar} 
                    alt={session.user.name || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal-900 dark:text-white truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION MENU */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-charcoal-300 dark:scrollbar-thumb-charcoal-600">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => isMobile && setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                      ${active 
                        ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 font-semibold shadow-sm' 
                        : 'text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 hover:text-charcoal-900 dark:hover:text-white'
                      }
                    `}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={`${active ? 'text-gold-600 dark:text-gold-400' : 'group-hover:scale-110'} transition-transform duration-200`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-neutral-200 dark:border-charcoal-700 space-y-2">
          <Link
            href="/dashboard/settings"
            onClick={() => isMobile && setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>

          <button
            onClick={() => {
              // Handle logout
              if (isMobile) setIsOpen(false);
              // Add your logout logic here
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* VERSION INFO */}
        <div className="p-4 text-center border-t border-neutral-200 dark:border-charcoal-700">
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Version 1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
