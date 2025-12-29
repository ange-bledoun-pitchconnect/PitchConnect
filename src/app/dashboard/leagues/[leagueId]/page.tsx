// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE OVERVIEW v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/leagues/[leagueId]/page.tsx
// Purpose: Main league dashboard with overview, standings preview, teams
//
// FEATURES:
// ✅ Server-side rendering with auth check
// ✅ Multi-sport support (12 sports)
// ✅ Sport-specific scoring display
// ✅ Points system from LeagueConfiguration
// ✅ Standings preview (top 5)
// ✅ Teams grid with club info
// ✅ Recent results
// ✅ Quick actions based on role
// ✅ Delete league (admin only)
// ✅ Dark mode + responsive design
// ✅ Schema-aligned data models
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LeagueOverviewClient from './LeagueOverviewClient';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface LeagueOverviewData {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  country: string;
  status: string;
  format: string;
  visibility: string;
  logo: string | null;
  description: string | null;
  // From LeagueConfiguration
  configuration: {
    pointsForWin: number;
    pointsForDraw: number;
    pointsForLoss: number;
    bonusPointsEnabled: boolean;
    bonusPointsConfig: Record<string, number> | null;
    minTeams: number;
    maxTeams: number | null;
    registrationOpen: boolean;
  } | null;
  // Current season
  currentSeason: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date | null;
  } | null;
  // Stats
  stats: {
    totalTeams: number;
    totalMatches: number;
    completedMatches: number;
    upcomingMatches: number;
    pendingInvitations: number;
  };
  // Standings preview (top 5)
  standingsPreview: Array<{
    position: number;
    teamId: string;
    teamName: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
    goalDifference: number;
  }>;
  // Teams
  teams: Array<{
    id: string;
    name: string;
    ageGroup: string | null;
    category: string;
    club: {
      name: string;
      city: string | null;
    } | null;
  }>;
  // Recent results
  recentResults: Array<{
    id: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
    homeScore: number | null;
    awayScore: number | null;
    kickOffTime: Date;
  }>;
  // Admin info
  admin: {
    firstName: string;
    lastName: string;
  } | null;
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, {
  label: string;
  icon: string;
  color: string;
  scoringLabel: string;
  defaultPoints: { win: number; draw: number; loss: number };
}> = {
  FOOTBALL: { 
    label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600',
    scoringLabel: 'Goals', defaultPoints: { win: 3, draw: 1, loss: 0 }
  },
  RUGBY: { 
    label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600',
    scoringLabel: 'Points', defaultPoints: { win: 4, draw: 2, loss: 0 }
  },
  CRICKET: { 
    label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600',
    scoringLabel: 'Runs', defaultPoints: { win: 2, draw: 1, loss: 0 }
  },
  BASKETBALL: { 
    label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600',
    scoringLabel: 'Points', defaultPoints: { win: 2, draw: 0, loss: 0 }
  },
  NETBALL: { 
    label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600',
    scoringLabel: 'Goals', defaultPoints: { win: 2, draw: 1, loss: 0 }
  },
  HOCKEY: { 
    label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600',
    scoringLabel: 'Goals', defaultPoints: { win: 3, draw: 1, loss: 0 }
  },
  AMERICAN_FOOTBALL: { 
    label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600',
    scoringLabel: 'Points', defaultPoints: { win: 1, draw: 0, loss: 0 }
  },
  LACROSSE: { 
    label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600',
    scoringLabel: 'Goals', defaultPoints: { win: 2, draw: 1, loss: 0 }
  },
  AUSTRALIAN_RULES: { 
    label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600',
    scoringLabel: 'Points', defaultPoints: { win: 4, draw: 2, loss: 0 }
  },
  GAELIC_FOOTBALL: { 
    label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600',
    scoringLabel: 'Scores', defaultPoints: { win: 2, draw: 1, loss: 0 }
  },
  FUTSAL: { 
    label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600',
    scoringLabel: 'Goals', defaultPoints: { win: 3, draw: 1, loss: 0 }
  },
  BEACH_FOOTBALL: { 
    label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500',
    scoringLabel: 'Goals', defaultPoints: { win: 3, draw: 1, loss: 0 }
  },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getLeagueOverview(leagueId: string, userId?: string): Promise<{
  data: LeagueOverviewData | null;
  isAdmin: boolean;
}> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      configuration: true,
      seasons: {
        where: { isCurrent: true },
        take: 1,
        include: {
          matches: {
            orderBy: { kickOffTime: 'desc' },
            take: 5,
            where: { status: 'FINISHED' },
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
          standings: {
            orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }],
            take: 5,
            include: {
              team: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { matches: true },
          },
        },
      },
      teams: {
        take: 9,
        include: {
          club: { select: { name: true, city: true } },
        },
      },
      _count: {
        select: { teams: true, invitations: true },
      },
    },
  });

  if (!league) return { data: null, isAdmin: false };

  // Check if user is admin
  let isAdmin = false;
  let adminUser = null;
  if (userId) {
    const leagueAdmin = await prisma.leagueAdminLeague.findFirst({
      where: {
        leagueId,
        leagueAdmin: { userId },
      },
      include: {
        leagueAdmin: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    isAdmin = !!leagueAdmin;
    if (leagueAdmin) {
      adminUser = leagueAdmin.leagueAdmin.user;
    }
  }

  const currentSeason = league.seasons[0];
  const allMatches = currentSeason?.matches || [];

  // Get match counts
  const completedCount = await prisma.match.count({
    where: { seasonId: currentSeason?.id, status: 'FINISHED' },
  });
  const upcomingCount = await prisma.match.count({
    where: { seasonId: currentSeason?.id, status: 'SCHEDULED' },
  });

  return {
    data: {
      id: league.id,
      name: league.name,
      code: league.code,
      sport: league.sport as Sport,
      country: league.country,
      status: league.status,
      format: league.format || 'LEAGUE',
      visibility: league.visibility,
      logo: league.logo,
      description: league.description,
      configuration: league.configuration ? {
        pointsForWin: league.configuration.pointsForWin,
        pointsForDraw: league.configuration.pointsForDraw,
        pointsForLoss: league.configuration.pointsForLoss,
        bonusPointsEnabled: league.configuration.bonusPointsEnabled,
        bonusPointsConfig: league.configuration.bonusPointsConfig as Record<string, number> | null,
        minTeams: league.configuration.minTeams,
        maxTeams: league.configuration.maxTeams,
        registrationOpen: league.configuration.registrationOpen,
      } : null,
      currentSeason: currentSeason ? {
        id: currentSeason.id,
        name: currentSeason.name,
        startDate: currentSeason.startDate,
        endDate: currentSeason.endDate,
      } : null,
      stats: {
        totalTeams: league._count.teams,
        totalMatches: currentSeason?._count.matches || 0,
        completedMatches: completedCount,
        upcomingMatches: upcomingCount,
        pendingInvitations: league._count.invitations,
      },
      standingsPreview: (currentSeason?.standings || []).map((s, idx) => ({
        position: idx + 1,
        teamId: s.team.id,
        teamName: s.team.name,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        points: s.points,
        goalDifference: s.goalDifference,
      })),
      teams: league.teams.map(t => ({
        id: t.id,
        name: t.name,
        ageGroup: t.ageGroup,
        category: t.category,
        club: t.club,
      })),
      recentResults: allMatches.map(m => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        kickOffTime: m.kickOffTime,
      })),
      admin: adminUser,
    },
    isAdmin,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function LeagueOverviewPage({
  params,
}: {
  params: { leagueId: string };
}) {
  const session = await getServerSession(authOptions);
  const { data, isAdmin } = await getLeagueOverview(params.leagueId, session?.user?.id);

  if (!data) {
    notFound();
  }

  const sportConfig = SPORT_CONFIG[data.sport];

  // Use configuration points or sport defaults
  const pointsSystem = data.configuration 
    ? {
        win: data.configuration.pointsForWin,
        draw: data.configuration.pointsForDraw,
        loss: data.configuration.pointsForLoss,
      }
    : sportConfig.defaultPoints;

  return (
    <LeagueOverviewClient
      league={data}
      sportConfig={sportConfig}
      pointsSystem={pointsSystem}
      isAdmin={isAdmin}
    />
  );
}