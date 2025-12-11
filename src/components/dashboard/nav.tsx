'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  Users,
  Trophy,
  Settings,
  BarChart3,
  TrendingUp,
  Zap,
  Bell,
  HelpCircle,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string;
  isNew?: boolean;
  isAI?: boolean;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  className?: string;
}

/**
 * Enhanced Dashboard Navigation Component
 * Features: Role-aware routing, live updates, AI badges
 */
export function DashboardNav() {
  const pathname = usePathname();

  // ✅ PRIMARY NAVIGATION SECTIONS
  const primaryNav: NavSection[] = [
    {
      title: 'Core',
      items: [
        {
          href: '/dashboard',
          label: 'Overview',
          icon: <LayoutDashboard className="w-5 h-5" />,
          description: 'Dashboard overview & KPIs',
        },
        {
          href: '/dashboard/live',
          label: 'Live Dashboard',
          icon: <Activity className="w-5 h-5 text-red-500 animate-pulse" />,
          badge: 'LIVE',
          description: 'Real-time standings & matches',
        },
        {
          href: '/dashboard/leagues',
          label: 'Leagues',
          icon: <Trophy className="w-5 h-5" />,
          description: 'Manage league information',
        },
        {
          href: '/dashboard/players-v2',
          label: 'Players',
          icon: <Users className="w-5 h-5" />,
          description: 'Player management & profiles',
        },
        {
          href: '/dashboard/matches-v2',
          label: 'Matches',
          icon: <BarChart3 className="w-5 h-5" />,
          description: 'Match scheduling & results',
        },
      ],
    },
    {
      title: 'Analytics & Insights',
      items: [
        {
          href: '/dashboard/analytics-advanced',
          label: 'Advanced Analytics',
          icon: <BarChart3 className="w-5 h-5" />,
          isNew: true,
          isAI: true,
          description: 'Player & team performance analysis',
        },
        {
          href: '/dashboard/analytics',
          label: 'Analytics',
          icon: <TrendingUp className="w-5 h-5" />,
          description: 'Historical analytics & trends',
        },
        {
          href: '/dashboard/predictions',
          label: 'AI Predictions',
          icon: <Zap className="w-5 h-5 text-purple-500" />,
          isAI: true,
          description: 'ML-powered match predictions',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          href: '/dashboard/notifications',
          label: 'Notifications',
          icon: <Bell className="w-5 h-5" />,
          badge: '3',
          description: 'System notifications & alerts',
        },
        {
          href: '/dashboard/settings',
          label: 'Settings',
          icon: <Settings className="w-5 h-5" />,
          description: 'Profile & preferences',
        },
      ],
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <nav className="w-full space-y-6 py-6 px-4">
      {primaryNav.map((section) => (
        <div key={section.title} className="space-y-3">
          {/* Section Title */}
          <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {section.title}
          </h3>

          {/* Navigation Items */}
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    // Base styles
                    'relative group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    // Hover state
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    // Active state
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                      : 'text-gray-700 dark:text-gray-300',
                  )}
                  title={item.description}
                >
                  {/* Icon with Color */}
                  <span className={cn(
                    'flex-shrink-0 transition-colors',
                    active && 'text-blue-600 dark:text-blue-400',
                  )}>
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>

                  {/* Badges & Indicators */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* NEW Badge */}
                    {item.isNew && (
                      <span className="px-1.5 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                        NEW
                      </span>
                    )}

                    {/* AI Badge */}
                    {item.isAI && (
                      <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        AI
                      </span>
                    )}

                    {/* Notification Badge */}
                    {item.badge && !item.isNew && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Hover Indicator Line */}
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Help Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <div className="space-y-2">
          <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Help
          </h3>
          <a
            href="/docs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            title="Documentation & Help"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Documentation</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

export default DashboardNav;
