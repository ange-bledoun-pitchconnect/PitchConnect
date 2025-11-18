'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  userType?: string;
}

const COACH_MENU = [
  { label: 'Overview', href: '/dashboard/coach', icon: <Trophy size={20} /> },
  { label: 'Team', href: '/dashboard/coach/team', icon: <Users size={20} /> },
  { label: 'Matches', href: '/dashboard/coach/matches', icon: <Calendar size={20} /> },
  { label: 'Tactics', href: '/dashboard/coach/tactics', icon: <Target size={20} /> },
  { label: 'Training', href: '/dashboard/coach/training', icon: <Zap size={20} /> },
];

const PLAYER_MENU = [
  { label: 'Overview', href: '/dashboard/player', icon: <Trophy size={20} /> },
  { label: 'Teams', href: '/dashboard/player/teams', icon: <Users size={20} /> },
  { label: 'Stats', href: '/dashboard/player/stats', icon: <BarChart3 size={20} /> },
];

const MANAGER_MENU = [
  { label: 'Overview', href: '/dashboard/manager', icon: <Trophy size={20} /> },
  { label: 'Clubs', href: '/dashboard/manager/clubs', icon: <Building2 size={20} /> },
  { label: 'Analytics', href: '/dashboard/manager/analytics', icon: <TrendingUp size={20} /> },
];

const LEAGUE_ADMIN_MENU = [
  { label: 'Overview', href: '/dashboard/league-admin', icon: <Shield size={20} /> },
  { label: 'Competitions', href: '/dashboard/league-admin/competitions', icon: <Trophy size={20} /> },
  { label: 'Standings', href: '/dashboard/league-admin/standings', icon: <Target size={20} /> },
];

const SUPERADMIN_MENU = [
  { label: 'Overview', href: '/dashboard/superadmin', icon: <Shield size={20} /> },
  { label: 'Users', href: '/dashboard/superadmin/users', icon: <Users size={20} /> },
  { label: 'System', href: '/dashboard/superadmin/system', icon: <Settings size={20} /> },
];

const getMenuForRole = (userType?: string) => {
  switch (userType) {
    case 'COACH':
      return COACH_MENU;
    case 'MANAGER':
      return MANAGER_MENU;
    case 'LEAGUE_ADMIN':
      return LEAGUE_ADMIN_MENU;
    case 'SUPERADMIN':
      return SUPERADMIN_MENU;
    case 'PLAYER':
    default:
      return PLAYER_MENU;
  }
};

export function DashboardSidebar({ userType = 'PLAYER' }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuItems = getMenuForRole(userType);

  const isActive = (href: string) => {
    if (href.endsWith('/coach') || href.endsWith('/player') || href.endsWith('/manager') || href.endsWith('/league-admin') || href.endsWith('/superadmin')) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-neutral-200 transition-all duration-300 flex flex-col shadow-sm h-screen sticky top-0',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-neutral-200">
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

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm group relative',
                active
                  ? 'bg-gradient-to-r from-gold-100 to-orange-100 text-gold-700 shadow-sm'
                  : 'text-charcoal-600 hover:bg-neutral-100 hover:text-gold-600'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-gold-500 to-orange-400 rounded-r-full" />
              )}
              <span className={cn('flex-shrink-0', active ? 'text-gold-600' : '')}>
                {item.icon}
              </span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-neutral-200 p-3">
        <Link
          href="/dashboard/settings/profile"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm',
            isActive('/dashboard/settings')
              ? 'bg-purple-100 text-purple-700'
              : 'text-charcoal-600 hover:bg-neutral-100 hover:text-purple-600'
          )}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings size={20} />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse Button */}
      <div className="border-t border-neutral-200 p-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-3 text-charcoal-600 hover:bg-neutral-100 rounded-lg transition-all"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>
    </aside>
  );
}

DashboardSidebar.displayName = 'DashboardSidebar';
