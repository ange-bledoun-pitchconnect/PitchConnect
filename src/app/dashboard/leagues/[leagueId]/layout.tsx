// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE LAYOUT v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/leagues/[leagueId]/layout.tsx
// Purpose: Shared layout wrapper for all league sub-pages
//
// FEATURES:
// ✅ Server-side rendering with auth check
// ✅ Role-based tab visibility (Settings/Analytics hidden for non-admins)
// ✅ Multi-sport support with sport icons
// ✅ League header with key info
// ✅ Active tab detection
// ✅ Dark mode + responsive design
// ✅ Schema-aligned data fetching
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Globe,
  Lock,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import LeagueLayoutClient from './LeagueLayoutClient';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type Visibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

interface LeagueLayoutData {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  visibility: Visibility;
  status: string;
  logo: string | null;
  currentSeason: {
    id: string;
    name: string;
  } | null;
  stats: {
    teams: number;
    matches: number;
  };
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getLeagueLayout(leagueId: string, userId?: string): Promise<{
  league: LeagueLayoutData | null;
  isAdmin: boolean;
}> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      seasons: {
        where: { isCurrent: true },
        take: 1,
        include: {
          _count: { select: { matches: true } },
        },
      },
      _count: { select: { teams: true } },
    },
  });

  if (!league) return { league: null, isAdmin: false };

  // Check if user is admin
  let isAdmin = false;
  if (userId) {
    const leagueAdmin = await prisma.leagueAdminLeague.findFirst({
      where: {
        leagueId,
        leagueAdmin: { userId },
      },
    });
    isAdmin = !!leagueAdmin;
  }

  const currentSeason = league.seasons[0];

  return {
    league: {
      id: league.id,
      name: league.name,
      code: league.code,
      sport: league.sport as Sport,
      visibility: league.visibility as Visibility,
      status: league.status,
      logo: league.logo,
      currentSeason: currentSeason ? {
        id: currentSeason.id,
        name: currentSeason.name,
      } : null,
      stats: {
        teams: league._count.teams,
        matches: currentSeason?._count.matches || 0,
      },
    },
    isAdmin,
  };
}

// =============================================================================
// MAIN LAYOUT COMPONENT
// =============================================================================

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { leagueId: string };
}) {
  const session = await getServerSession(authOptions);
  const { league, isAdmin } = await getLeagueLayout(params.leagueId, session?.user?.id);

  if (!league) {
    notFound();
  }

  // Check access for private leagues
  if (league.visibility === 'PRIVATE' && !session?.user) {
    redirect('/auth/signin');
  }

  const sportConfig = SPORT_CONFIG[league.sport];

  // Define navigation tabs
  const tabs = [
    { id: 'overview', label: 'Overview', href: `/dashboard/leagues/${league.id}`, icon: Trophy, public: true },
    { id: 'standings', label: 'Standings', href: `/dashboard/leagues/${league.id}/standings`, icon: TrendingUp, public: true },
    { id: 'fixtures', label: 'Fixtures', href: `/dashboard/leagues/${league.id}/fixtures`, icon: Calendar, public: true },
    { id: 'teams', label: 'Teams', href: `/dashboard/leagues/${league.id}/teams`, icon: Users, public: true },
    { id: 'analytics', label: 'Analytics', href: `/dashboard/leagues/${league.id}/analytics`, icon: BarChart3, public: false },
    { id: 'settings', label: 'Settings', href: `/dashboard/leagues/${league.id}/settings`, icon: Settings, public: false },
  ];

  // Filter tabs based on role
  const visibleTabs = tabs.filter(tab => tab.public || isAdmin);

  const visibilityIcons = {
    PUBLIC: <Globe className="w-4 h-4" />,
    PRIVATE: <Lock className="w-4 h-4" />,
    UNLISTED: <EyeOff className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/10 to-orange-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Link
          href="/dashboard/leagues"
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leagues
        </Link>

        {/* League Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${sportConfig.color}`} />
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* League Logo/Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
                  {league.logo ? (
                    <img src={league.logo} alt={league.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <span className="text-3xl">{sportConfig.icon}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{league.name}</h1>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-bold">
                      {league.code}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      league.status === 'ACTIVE' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : league.status === 'PENDING'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {league.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      {visibilityIcons[league.visibility]}
                      {league.visibility}
                    </span>
                    <span>•</span>
                    <span>{sportConfig.label}</span>
                    {league.currentSeason && (
                      <>
                        <span>•</span>
                        <span>{league.currentSeason.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{league.stats.teams}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Teams</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{league.stats.matches}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Matches</p>
                </div>
                {isAdmin && (
                  <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-6">
            <nav className="flex gap-1 overflow-x-auto py-2">
              <LeagueLayoutClient 
                tabs={visibleTabs} 
                leagueId={league.id}
                sportColor={sportConfig.color}
              />
            </nav>
          </div>
        </div>

        {/* Page Content */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}