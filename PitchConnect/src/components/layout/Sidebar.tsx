'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Trophy,
  Users,
  BarChart3,
  Calendar,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Building2,
  TrendingUp,
  User,
  LogOut,
  Search,
  DollarSign,
  Baby,
  Plus,
  Home,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  className?: string;
}

// Menu configurations for each role
const SUPERADMIN_MENU = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: Shield },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users },
  { label: 'Clubs', href: '/dashboard/admin/clubs', icon: Building2 },
  { label: 'Leagues', href: '/dashboard/admin/leagues', icon: Trophy },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: TrendingUp },
];

const LEAGUE_ADMIN_MENU = [
  { label: 'Dashboard', href: '/dashboard/leagues', icon: Home },
  { label: 'My Leagues', href: '/dashboard/leagues', icon: Trophy },
  { label: 'Create League', href: '/dashboard/leagues/create', icon: Plus },
  { label: 'Teams', href: '/dashboard/leagues/teams', icon: Shield },
  { label: 'Fixtures', href: '/dashboard/leagues/fixtures', icon: Calendar },
  { label: 'Standings', href: '/dashboard/leagues/standings', icon: TrendingUp },
];

const CLUB_MANAGER_MENU = [
  { label: 'Dashboard', href: '/dashboard/clubs', icon: Home },
  { label: 'My Clubs', href: '/dashboard/clubs', icon: Building2 },
  { label: 'Teams', href: '/dashboard/clubs/teams', icon: Shield },
  { label: 'Players', href: '/dashboard/clubs/players', icon: Users },
  { label: 'Matches', href: '/dashboard/clubs/matches', icon: Calendar },
];

const COACH_MENU = [
  { label: 'Dashboard', href: '/dashboard/coach', icon: Home },
  { label: 'My Teams', href: '/dashboard/coach/teams', icon: Users },
  { label: 'Training', href: '/dashboard/coach/training', icon: Zap },
  { label: 'Matches', href: '/dashboard/coach/matches', icon: Calendar },
  { label: 'Tactics', href: '/dashboard/coach/tactics', icon: Target },
  { label: 'Analytics', href: '/dashboard/coach/analytics', icon: BarChart3 },
];

const TREASURER_MENU = [
  { label: 'Dashboard', href: '/dashboard/treasurer', icon: Home },
  { label: 'Payments', href: '/dashboard/treasurer/payments', icon: DollarSign },
  { label: 'Invoices', href: '/dashboard/treasurer/invoices', icon: BarChart3 },
  { label: 'Reports', href: '/dashboard/treasurer/reports', icon: TrendingUp },
];

const PLAYER_MENU = [
  { label: 'Dashboard', href: '/dashboard/player', icon: Home },
  { label: 'My Profile', href: '/dashboard/player/profile', icon: User },
  { label: 'Browse Teams', href: '/dashboard/player/browse-teams', icon: Search },
  { label: 'My Teams', href: '/dashboard/player/teams', icon: Users },
  { label: 'Matches', href: '/dashboard/player/matches', icon: Calendar },
  { label: 'Stats', href: '/dashboard/player/stats', icon: BarChart3 },
];

const PARENT_MENU = [
  { label: 'Dashboard', href: '/dashboard/parent', icon: Home },
  { label: 'Children', href: '/dashboard/parent/children', icon: Baby },
  { label: 'Teams', href: '/dashboard/parent/teams', icon: Users },
  { label: 'Matches', href: '/dashboard/parent/matches', icon: Calendar },
];

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();

  const user = session?.user as any;
  const isSuperAdmin = user?.isSuperAdmin || false;
  const roles = user?.roles || [];

  // Determine menu items based on role priority
  const getMenuItems = () => {
    if (isSuperAdmin) return SUPERADMIN_MENU;
    if (roles.includes('LEAGUE_ADMIN')) return LEAGUE_ADMIN_MENU;
    if (roles.includes('CLUB_MANAGER')) return CLUB_MANAGER_MENU;
    if (roles.includes('COACH')) return COACH_MENU;
    if (roles.includes('TREASURER')) return TREASURER_MENU;
    if (roles.includes('PLAYER') || roles.includes('PLAYER_PRO')) return PLAYER_MENU;
    if (roles.includes('PARENT')) return PARENT_MENU;
    return PLAYER_MENU; // Default
  };

  const menuItems = getMenuItems();

  const isActive = (href: string) => {
    if (href === '/dashboard/admin' || href === '/dashboard/player' || href === '/dashboard/coach' || href === '/dashboard/clubs' || href === '/dashboard/leagues') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Get role badge
  const getRoleBadge = () => {
    if (isSuperAdmin) return { text: 'SUPERADMIN', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
    if (roles.includes('LEAGUE_ADMIN')) return { text: 'LEAGUE ADMIN', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' };
    if (roles.includes('CLUB_MANAGER')) return { text: 'CLUB MANAGER', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' };
    if (roles.includes('COACH')) return { text: 'COACH', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
    if (roles.includes('TREASURER')) return { text: 'TREASURER', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' };
    if (roles.includes('PLAYER_PRO')) return { text: 'PLAYER PRO', color: 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300' };
    if (roles.includes('PLAYER')) return { text: 'PLAYER', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' };
    if (roles.includes('PARENT')) return { text: 'PARENT', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' };
    return { text: 'USER', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' };
  };

  const roleBadge = getRoleBadge();

  return (
    <aside
      className={cn(
        'bg-white dark:bg-charcoal-800 border-r border-neutral-200 dark:border-charcoal-700 transition-all duration-300 flex flex-col shadow-sm h-screen sticky top-0',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-shadow">
            ⚽
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-gold-600 to-orange-500 bg-clip-text text-transparent">
              PitchConnect
            </span>
          )}
        </Link>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700">
          <div className="space-y-2">
            <p className="font-semibold text-charcoal-900 dark:text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 truncate">{user?.email}</p>
            <span className={cn('text-xs px-2 py-1 rounded-full font-semibold inline-block', roleBadge.color)}>
              {roleBadge.text}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm group relative',
                active
                  ? 'bg-gradient-to-r from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30 text-gold-700 dark:text-gold-300 shadow-sm'
                  : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-neutral-100 dark:hover:bg-charcoal-700 hover:text-gold-600 dark:hover:text-gold-400'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-gold-500 to-orange-400 rounded-r-full" />
              )}
              <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-gold-600 dark:text-gold-400' : '')} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-neutral-200 dark:border-charcoal-700 p-3">
        <Link
          href="/dashboard/settings/profile"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm',
            pathname.startsWith('/dashboard/settings')
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-neutral-100 dark:hover:bg-charcoal-700 hover:text-purple-600 dark:hover:text-purple-400'
          )}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-2"
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <div className="border-t border-neutral-200 dark:border-charcoal-700 p-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-3 text-charcoal-600 dark:text-charcoal-400 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-all"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}

DashboardSidebar.displayName = 'DashboardSidebar';

