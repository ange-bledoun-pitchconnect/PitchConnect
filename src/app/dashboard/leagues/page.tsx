// =============================================================================
// 🏆 PITCHCONNECT - MY LEAGUES v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/leagues/page.tsx
// Purpose: Leagues directory with advanced filtering
//
// FEATURES:
// ✅ Server-side rendering with auth check
// ✅ Search + Sport + Status + Season filters
// ✅ Multi-sport support (12 sports from schema)
// ✅ Quick stats: Total, Active, Teams, Matches
// ✅ League cards with key info
// ✅ Quick actions (View, Manage Teams, Standings)
// ✅ Empty state with CTA
// ✅ Dark mode + responsive design
// ✅ Schema-aligned data models
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LeaguesListClient from './LeaguesListClient';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type LeagueStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface LeagueListItem {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  status: LeagueStatus;
  format: string;
  visibility: string;
  logo: string | null;
  country: string;
  currentSeason: {
    id: string;
    name: string;
  } | null;
  stats: {
    teams: number;
    matches: number;
  };
  isAdmin: boolean;
}

interface LeaguesPageData {
  leagues: LeagueListItem[];
  stats: {
    total: number;
    active: number;
    totalTeams: number;
    totalMatches: number;
  };
  filterOptions: {
    sports: Sport[];
    statuses: LeagueStatus[];
    seasons: string[];
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

async function getLeaguesData(userId: string): Promise<LeaguesPageData> {
  // Get leagues where user is admin
  const adminLeagues = await prisma.leagueAdminLeague.findMany({
    where: {
      leagueAdmin: { userId },
    },
    select: { leagueId: true },
  });
  const adminLeagueIds = adminLeagues.map(l => l.leagueId);

  // Get leagues where user is team manager (their team is in the league)
  const userTeamManagerRoles = await prisma.teamManager.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const userTeamIds = userTeamManagerRoles.map(tm => tm.teamId);

  const teamLeagues = await prisma.league.findMany({
    where: {
      teams: { some: { id: { in: userTeamIds } } },
    },
    select: { id: true },
  });
  const teamLeagueIds = teamLeagues.map(l => l.id);

  // Combine unique league IDs
  const allLeagueIds = [...new Set([...adminLeagueIds, ...teamLeagueIds])];

  // Fetch full league data
  const leagues = await prisma.league.findMany({
    where: {
      id: { in: allLeagueIds },
    },
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
    orderBy: { updatedAt: 'desc' },
  });

  // Get unique filter values
  const uniqueSports = [...new Set(leagues.map(l => l.sport))] as Sport[];
  const uniqueStatuses = [...new Set(leagues.map(l => l.status))] as LeagueStatus[];
  const uniqueSeasons = [...new Set(
    leagues
      .flatMap(l => l.seasons)
      .map(s => s.name)
  )].filter(Boolean);

  // Transform data
  const leagueItems: LeagueListItem[] = leagues.map(league => ({
    id: league.id,
    name: league.name,
    code: league.code,
    sport: league.sport as Sport,
    status: league.status as LeagueStatus,
    format: league.format || 'LEAGUE',
    visibility: league.visibility,
    logo: league.logo,
    country: league.country,
    currentSeason: league.seasons[0] ? {
      id: league.seasons[0].id,
      name: league.seasons[0].name,
    } : null,
    stats: {
      teams: league._count.teams,
      matches: league.seasons[0]?._count.matches || 0,
    },
    isAdmin: adminLeagueIds.includes(league.id),
  }));

  // Calculate stats
  const stats = {
    total: leagueItems.length,
    active: leagueItems.filter(l => l.status === 'ACTIVE').length,
    totalTeams: leagueItems.reduce((sum, l) => sum + l.stats.teams, 0),
    totalMatches: leagueItems.reduce((sum, l) => sum + l.stats.matches, 0),
  };

  return {
    leagues: leagueItems,
    stats,
    filterOptions: {
      sports: uniqueSports,
      statuses: uniqueStatuses,
      seasons: uniqueSeasons,
    },
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function LeaguesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard/leagues');
  }

  const data = await getLeaguesData(session.user.id);

  return (
    <LeaguesListClient
      leagues={data.leagues}
      stats={data.stats}
      filterOptions={data.filterOptions}
      sportConfig={SPORT_CONFIG}
    />
  );
}