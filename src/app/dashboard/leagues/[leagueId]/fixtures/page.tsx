// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE FIXTURES v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/leagues/[leagueId]/fixtures
// Access: PUBLIC for public leagues, authenticated for private leagues
//         LEAGUE_ADMIN for editing/generating
//
// FEATURES:
// ✅ Multi-format: Round-robin, Knockout, Group + Knockout (auto-detected)
// ✅ Multi-sport score entry (Goals/Tries/Runs/Points)
// ✅ Simple score entry + optional detailed breakdown
// ✅ Uses Match.homeTeam/awayTeam (Team relations)
// ✅ Matchweek/Round organization
// ✅ Auto-generate fixtures based on format
// ✅ Score entry modal with sport-specific fields
// ✅ Server-side data + Client interactivity
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import FixturesClient from './FixturesClient';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type CompetitionFormat = 'LEAGUE' | 'KNOCKOUT' | 'GROUP_KNOCKOUT' | 'ROUND_ROBIN';

interface Match {
  id: string;
  homeTeam: { id: string; name: string; logo?: string | null };
  awayTeam: { id: string; name: string; logo?: string | null };
  kickOffTime: Date;
  venue: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  homeScore: number | null;
  awayScore: number | null;
  // Sport-specific detailed scores
  homeScoreDetails?: Record<string, number> | null;
  awayScoreDetails?: Record<string, number> | null;
  round?: string | null;
  matchweek?: number | null;
  groupName?: string | null;
}

interface Fixture {
  id: string;
  label: string; // "Matchweek 1", "Quarter-Finals", "Group A - Round 1"
  type: 'MATCHWEEK' | 'KNOCKOUT_ROUND' | 'GROUP_ROUND';
  matches: Match[];
}

interface LeagueData {
  id: string;
  name: string;
  sport: Sport;
  format: CompetitionFormat;
  season: string;
  isPublic: boolean;
  fixtures: Fixture[];
  stats: {
    totalMatches: number;
    completed: number;
    upcoming: number;
    live: number;
  };
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, {
  label: string;
  icon: string;
  color: string;
  scoreLabel: string;
  detailedScoring: Array<{ key: string; label: string; icon: string }>;
}> = {
  FOOTBALL: {
    label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600',
    scoreLabel: 'Goals',
    detailedScoring: [
      { key: 'goals', label: 'Goals', icon: '⚽' },
      { key: 'penalties', label: 'Penalties', icon: '🥅' },
      { key: 'ownGoals', label: 'Own Goals', icon: '🔴' },
    ],
  },
  RUGBY: {
    label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600',
    scoreLabel: 'Points',
    detailedScoring: [
      { key: 'tries', label: 'Tries (5pts)', icon: '🏉' },
      { key: 'conversions', label: 'Conversions (2pts)', icon: '🥅' },
      { key: 'penalties', label: 'Penalties (3pts)', icon: '🦵' },
      { key: 'dropGoals', label: 'Drop Goals (3pts)', icon: '🎯' },
    ],
  },
  CRICKET: {
    label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600',
    scoreLabel: 'Runs/Wickets',
    detailedScoring: [
      { key: 'runs', label: 'Runs', icon: '🏏' },
      { key: 'wickets', label: 'Wickets', icon: '🎳' },
      { key: 'overs', label: 'Overs', icon: '⏱️' },
      { key: 'extras', label: 'Extras', icon: '➕' },
    ],
  },
  BASKETBALL: {
    label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600',
    scoreLabel: 'Points',
    detailedScoring: [
      { key: 'fieldGoals', label: 'Field Goals', icon: '🏀' },
      { key: 'threePointers', label: '3-Pointers', icon: '🎯' },
      { key: 'freeThrows', label: 'Free Throws', icon: '🥅' },
    ],
  },
  NETBALL: {
    label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600',
    scoreLabel: 'Goals',
    detailedScoring: [
      { key: 'goals', label: 'Goals', icon: '🏐' },
      { key: 'superShots', label: 'Super Shots (2pts)', icon: '⭐' },
    ],
  },
  HOCKEY: {
    label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600',
    scoreLabel: 'Goals',
    detailedScoring: [
      { key: 'fieldGoals', label: 'Field Goals', icon: '🏒' },
      { key: 'penaltyCorners', label: 'Penalty Corners', icon: '🎯' },
      { key: 'penaltyStrokes', label: 'Penalty Strokes', icon: '🥅' },
    ],
  },
  AMERICAN_FOOTBALL: {
    label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600',
    scoreLabel: 'Points',
    detailedScoring: [
      { key: 'touchdowns', label: 'Touchdowns (6pts)', icon: '🏈' },
      { key: 'extraPoints', label: 'Extra Points (1pt)', icon: '🥅' },
      { key: 'twoPointConversions', label: '2-Point Conversions', icon: '2️⃣' },
      { key: 'fieldGoals', label: 'Field Goals (3pts)', icon: '🎯' },
      { key: 'safeties', label: 'Safeties (2pts)', icon: '🛡️' },
    ],
  },
  LACROSSE: {
    label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600',
    scoreLabel: 'Goals',
    detailedScoring: [
      { key: 'goals', label: 'Goals', icon: '🥍' },
      { key: 'twoPointGoals', label: '2-Point Goals', icon: '2️⃣' },
    ],
  },
  AUSTRALIAN_RULES: {
    label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600',
    scoreLabel: 'Points',
    detailedScoring: [
      { key: 'goals', label: 'Goals (6pts)', icon: '🥅' },
      { key: 'behinds', label: 'Behinds (1pt)', icon: '📍' },
    ],
  },
  GAELIC_FOOTBALL: {
    label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600',
    scoreLabel: 'Scores',
    detailedScoring: [
      { key: 'goals', label: 'Goals (3pts)', icon: '🥅' },
      { key: 'points', label: 'Points (1pt)', icon: '📍' },
    ],
  },
  FUTSAL: {
    label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600',
    scoreLabel: 'Goals',
    detailedScoring: [
      { key: 'goals', label: 'Goals', icon: '⚽' },
      { key: 'penalties', label: 'Penalties', icon: '🥅' },
    ],
  },
  BEACH_FOOTBALL: {
    label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500',
    scoreLabel: 'Goals',
    detailedScoring: [
      { key: 'goals', label: 'Goals', icon: '⚽' },
      { key: 'overheadKicks', label: 'Overhead Kicks', icon: '🔄' },
    ],
  },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getLeagueFixtures(leagueId: string, userId?: string): Promise<LeagueData | null> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      seasons: {
        where: { isCurrent: true },
        take: 1,
        include: {
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true, logo: true } },
              awayTeam: { select: { id: true, name: true, logo: true } },
            },
            orderBy: [{ matchweek: 'asc' }, { kickOffTime: 'asc' }],
          },
        },
      },
    },
  });

  if (!league) return null;

  const season = league.seasons[0];
  const matches = season?.matches || [];

  // Group matches into fixtures based on format
  const fixturesMap = new Map<string, Fixture>();

  matches.forEach(match => {
    let fixtureKey: string;
    let fixtureLabel: string;
    let fixtureType: 'MATCHWEEK' | 'KNOCKOUT_ROUND' | 'GROUP_ROUND';

    if (match.groupName) {
      // Group stage match
      fixtureKey = `${match.groupName}-${match.matchweek || 1}`;
      fixtureLabel = `${match.groupName} - Round ${match.matchweek || 1}`;
      fixtureType = 'GROUP_ROUND';
    } else if (match.round) {
      // Knockout match
      fixtureKey = match.round;
      fixtureLabel = match.round;
      fixtureType = 'KNOCKOUT_ROUND';
    } else {
      // League match
      fixtureKey = `matchweek-${match.matchweek || 1}`;
      fixtureLabel = `Matchweek ${match.matchweek || 1}`;
      fixtureType = 'MATCHWEEK';
    }

    if (!fixturesMap.has(fixtureKey)) {
      fixturesMap.set(fixtureKey, {
        id: fixtureKey,
        label: fixtureLabel,
        type: fixtureType,
        matches: [],
      });
    }

    fixturesMap.get(fixtureKey)!.matches.push({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      kickOffTime: match.kickOffTime,
      venue: match.venue,
      status: match.status as Match['status'],
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeScoreDetails: match.homeScoreDetails as Record<string, number> | null,
      awayScoreDetails: match.awayScoreDetails as Record<string, number> | null,
      round: match.round,
      matchweek: match.matchweek,
      groupName: match.groupName,
    });
  });

  // Calculate stats
  const stats = {
    totalMatches: matches.length,
    completed: matches.filter(m => m.status === 'FINISHED').length,
    upcoming: matches.filter(m => m.status === 'SCHEDULED').length,
    live: matches.filter(m => ['LIVE', 'HALFTIME'].includes(m.status)).length,
  };

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

  return {
    id: league.id,
    name: league.name,
    sport: league.sport as Sport,
    format: (league.format as CompetitionFormat) || 'LEAGUE',
    season: season?.name || 'Current Season',
    isPublic: league.visibility === 'PUBLIC',
    fixtures: Array.from(fixturesMap.values()),
    stats,
  };
}

// =============================================================================
// MAIN PAGE COMPONENT (Server)
// =============================================================================

export default async function LeagueFixturesPage({
  params,
}: {
  params: { leagueId: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await getLeagueFixtures(params.leagueId, session?.user?.id);

  if (!data) {
    notFound();
  }

  // Check access for private leagues
  if (!data.isPublic && !session?.user) {
    notFound();
  }

  // Check if user is admin
  let isAdmin = false;
  if (session?.user?.id) {
    const leagueAdmin = await prisma.leagueAdminLeague.findFirst({
      where: {
        leagueId: params.leagueId,
        leagueAdmin: { userId: session.user.id },
      },
    });
    isAdmin = !!leagueAdmin;
  }

  const sportConfig = SPORT_CONFIG[data.sport];

  return (
    <FixturesClient
      leagueId={params.leagueId}
      leagueName={data.name}
      sport={data.sport}
      sportConfig={sportConfig}
      format={data.format}
      season={data.season}
      fixtures={data.fixtures}
      stats={data.stats}
      isAdmin={isAdmin}
    />
  );
}