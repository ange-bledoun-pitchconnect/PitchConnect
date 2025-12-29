// =============================================================================
// 🏆 PITCHCONNECT - LIVE DASHBOARD v3.0 (Enterprise Edition)
// =============================================================================
// Path: src/app/dashboard/live/page.tsx
// Purpose: Real-time league standings and match updates
//
// FEATURES:
// ✅ Server-side rendering with mixed auth
// ✅ Public leagues visible to all
// ✅ Private leagues require auth + membership
// ✅ Multi-sport support (12 sports)
// ✅ Sport-specific terminology
// ✅ Schema-aligned data models (LeagueStanding, Match, MatchStatus)
// ✅ Real-time auto-refresh
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import LiveDashboardClient from './LiveDashboardClient';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type MatchStatus = 
  | 'SCHEDULED' | 'WARMUP' | 'LIVE' | 'HALFTIME' | 'SECOND_HALF'
  | 'EXTRA_TIME_FIRST' | 'EXTRA_TIME_SECOND' | 'PENALTIES'
  | 'FINISHED' | 'CANCELLED' | 'POSTPONED' | 'ABANDONED';

type LeagueVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED' | 'INVITE_ONLY' | 'FRIENDS_ONLY';

interface LeagueOption {
  id: string;
  name: string;
  sport: Sport;
  season: number;
  visibility: LeagueVisibility;
  status: string;
  clubName: string;
}

interface StandingEntry {
  position: number;
  teamId: string | null;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
}

interface LiveMatch {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  kickOffTime: Date;
  venue: string | null;
}

interface LiveDashboardData {
  leagues: LeagueOption[];
  userLeagueIds: string[];
}

// =============================================================================
// SPORT CONFIGURATION - MULTI-SPORT LABELS
// =============================================================================

export const SPORT_CONFIG: Record<Sport, {
  label: string;
  icon: string;
  color: string;
  scoringLabel: string;
  scoringLabelPlural: string;
  differenceLabel: string;
  standingsColumns: {
    for: string;
    against: string;
    difference: string;
  };
}> = {
  FOOTBALL: {
    label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600',
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals', differenceLabel: 'GD',
    standingsColumns: { for: 'GF', against: 'GA', difference: 'GD' },
  },
  RUGBY: {
    label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600',
    scoringLabel: 'Point', scoringLabelPlural: 'Points', differenceLabel: 'PD',
    standingsColumns: { for: 'PF', against: 'PA', difference: 'PD' },
  },
  CRICKET: {
    label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600',
    scoringLabel: 'Run', scoringLabelPlural: 'Runs', differenceLabel: 'NRR',
    standingsColumns: { for: 'RF', against: 'RA', difference: 'NRR' },
  },
  BASKETBALL: {
    label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600',
    scoringLabel: 'Point', scoringLabelPlural: 'Points', differenceLabel: 'PD',
    standingsColumns: { for: 'PF', against: 'PA', difference: 'PD' },
  },
  NETBALL: {
    label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600',
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals', differenceLabel: 'GD',
    standingsColumns: { for: 'GF', against: 'GA', difference: 'GD' },
  },
  HOCKEY: {
    label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600',
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals', differenceLabel: 'GD',
    standingsColumns: { for: 'GF', against: 'GA', difference: 'GD' },
  },
  AMERICAN_FOOTBALL: {
    label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600',
    scoringLabel: 'Point', scoringLabelPlural: 'Points', differenceLabel: 'PD',
    standingsColumns: { for: 'PF', against: 'PA', difference: 'PD' },
  },
  LACROSSE: {
    label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600',
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals', differenceLabel: 'GD',
    standingsColumns: { for: 'GF', against: 'GA', difference: 'GD' },
  },
  AUSTRALIAN_RULES: {
    label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600',
    scoringLabel: 'Point', scoringLabelPlural: 'Points', differenceLabel: '%',
    standingsColumns: { for: 'PF', against: 'PA', difference: '%' },
  },
  GAELIC_FOOTBALL: {
    label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600',
    scoringLabel: 'Score', scoringLabelPlural: 'Scores', differenceLabel: 'SD',
    standingsColumns: { for: 'SF', against: 'SA', difference: 'SD' },
  },
  FUTSAL: {
    label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600',
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals', differenceLabel: 'GD',
    standingsColumns: { for: 'GF', against: 'GA', difference: 'GD' },
  },
  BEACH_FOOTBALL: {
    label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500',
    scoringLabel: 'Goal', scoringLabelPlural: 'Goals', differenceLabel: 'GD',
    standingsColumns: { for: 'GF', against: 'GA', difference: 'GD' },
  },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getLiveDashboardData(userId?: string): Promise<LiveDashboardData> {
  // Get all leagues
  const leagues = await prisma.league.findMany({
    where: {
      deletedAt: null,
      status: { in: ['ACTIVE', 'IN_PROGRESS'] },
    },
    include: {
      club: { select: { name: true, sport: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  // Get user's league memberships if authenticated
  let userLeagueIds: string[] = [];
  if (userId) {
    // Get leagues through team membership
    const userTeamPlayers = await prisma.teamPlayer.findMany({
      where: {
        player: { userId },
        isActive: true,
      },
      include: {
        team: {
          include: {
            leagueTeams: { select: { leagueId: true } },
          },
        },
      },
    });

    userLeagueIds = userTeamPlayers.flatMap(tp => 
      tp.team.leagueTeams.map(lt => lt.leagueId)
    );

    // Also get leagues where user is club manager/owner
    const userClubs = await prisma.club.findMany({
      where: {
        OR: [
          { managerId: userId },
          { ownerId: userId },
        ],
      },
      include: {
        leagues: { select: { id: true } },
      },
    });

    const clubLeagueIds = userClubs.flatMap(c => c.leagues.map(l => l.id));
    userLeagueIds = [...new Set([...userLeagueIds, ...clubLeagueIds])];
  }

  return {
    leagues: leagues.map(l => ({
      id: l.id,
      name: l.name,
      sport: l.club.sport as Sport,
      season: l.season,
      visibility: l.visibility as LeagueVisibility,
      status: l.status,
      clubName: l.club.name,
    })),
    userLeagueIds,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function LiveDashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getLiveDashboardData(session?.user?.id);

  // Filter leagues based on visibility and membership
  const accessibleLeagues = data.leagues.filter(league => {
    // Public leagues are always visible
    if (league.visibility === 'PUBLIC') return true;
    
    // For non-public leagues, user must be authenticated and a member
    if (!session?.user?.id) return false;
    return data.userLeagueIds.includes(league.id);
  });

  return (
    <LiveDashboardClient
      leagues={accessibleLeagues}
      sportConfig={SPORT_CONFIG}
      isAuthenticated={!!session?.user}
    />
  );
}