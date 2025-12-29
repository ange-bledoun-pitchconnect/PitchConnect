// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE STANDINGS v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/leagues/[leagueId]/standings
// Access: PUBLIC for public leagues, authenticated for private leagues
//
// FEATURES:
// ✅ Configurable columns (admin chooses which to display)
// ✅ Multi-sport support with sport-specific metrics
// ✅ Form guide visualization
// ✅ Position indicators (Champion, Promotion, Relegation)
// ✅ Search and sort functionality
// ✅ CSV export
// ✅ Server-side data fetching
// ✅ Dark mode + responsive design
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import StandingsClient from './StandingsClient';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface Standing {
  position: number;
  team: { id: string; name: string; logo?: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  // Universal
  points: number;
  form: ('W' | 'D' | 'L')[];
  // Sport-specific
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  pointDifference?: number;
  triesFor?: number;
  bonusPoints?: number;
  netRunRate?: number;
  goalPercentage?: number;
  percentage?: number;
  winPercentage?: number;
  scoresFor?: number;
  scoresAgainst?: number;
  scoreDifference?: number;
}

interface LeagueStandingsData {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  season: string;
  isPublic: boolean;
  standings: Standing[];
  displayColumns: string[];
  stats: {
    totalTeams: number;
    matchesPlayed: number;
    totalScored: number;
    avgPerMatch: number;
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

const COLUMN_DEFINITIONS: Record<string, { label: string; shortLabel: string; format?: 'number' | 'signed' | 'decimal' | 'percent' }> = {
  played: { label: 'Played', shortLabel: 'P' },
  won: { label: 'Won', shortLabel: 'W' },
  drawn: { label: 'Drawn', shortLabel: 'D' },
  lost: { label: 'Lost', shortLabel: 'L' },
  goalsFor: { label: 'Goals For', shortLabel: 'GF' },
  goalsAgainst: { label: 'Goals Against', shortLabel: 'GA' },
  goalDifference: { label: 'Goal Difference', shortLabel: 'GD', format: 'signed' },
  pointsFor: { label: 'Points For', shortLabel: 'PF' },
  pointsAgainst: { label: 'Points Against', shortLabel: 'PA' },
  pointDifference: { label: 'Point Difference', shortLabel: 'PD', format: 'signed' },
  triesFor: { label: 'Tries For', shortLabel: 'TF' },
  bonusPoints: { label: 'Bonus Points', shortLabel: 'BP' },
  netRunRate: { label: 'Net Run Rate', shortLabel: 'NRR', format: 'decimal' },
  goalPercentage: { label: 'Goal Percentage', shortLabel: '%', format: 'percent' },
  percentage: { label: 'Percentage', shortLabel: '%', format: 'percent' },
  winPercentage: { label: 'Win Percentage', shortLabel: 'PCT', format: 'percent' },
  scoresFor: { label: 'Scores For', shortLabel: 'SF' },
  scoresAgainst: { label: 'Scores Against', shortLabel: 'SA' },
  scoreDifference: { label: 'Score Difference', shortLabel: 'SD', format: 'signed' },
  points: { label: 'Points', shortLabel: 'Pts' },
  form: { label: 'Form', shortLabel: 'Form' },
};

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getLeagueStandings(leagueId: string): Promise<LeagueStandingsData | null> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      seasons: {
        where: { isCurrent: true },
        take: 1,
        include: {
          standings: {
            include: { team: { select: { id: true, name: true, logo: true } } },
            orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }, { goalsFor: 'desc' }],
          },
          matches: {
            where: { status: 'FINISHED' },
          },
        },
      },
      configuration: {
        select: { standingsColumns: true },
      },
    },
  });

  if (!league) return null;

  const season = league.seasons[0];
  const rawStandings = season?.standings || [];
  const matches = season?.matches || [];

  // Default columns based on sport if not configured
  const defaultColumns: Record<Sport, string[]> = {
    FOOTBALL: ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points', 'form'],
    RUGBY: ['played', 'won', 'drawn', 'lost', 'pointsFor', 'pointsAgainst', 'pointDifference', 'bonusPoints', 'points', 'form'],
    CRICKET: ['played', 'won', 'lost', 'netRunRate', 'points', 'form'],
    BASKETBALL: ['played', 'won', 'lost', 'pointsFor', 'pointsAgainst', 'pointDifference', 'winPercentage'],
    NETBALL: ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalPercentage', 'points', 'form'],
    HOCKEY: ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points', 'form'],
    AMERICAN_FOOTBALL: ['won', 'lost', 'winPercentage', 'pointsFor', 'pointsAgainst', 'pointDifference'],
    LACROSSE: ['played', 'won', 'lost', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points', 'form'],
    AUSTRALIAN_RULES: ['played', 'won', 'drawn', 'lost', 'pointsFor', 'pointsAgainst', 'percentage', 'points'],
    GAELIC_FOOTBALL: ['played', 'won', 'drawn', 'lost', 'scoresFor', 'scoresAgainst', 'scoreDifference', 'points', 'form'],
    FUTSAL: ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points', 'form'],
    BEACH_FOOTBALL: ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points', 'form'],
  };

  const displayColumns = (league.configuration?.standingsColumns as string[]) || defaultColumns[league.sport as Sport] || defaultColumns.FOOTBALL;

  // Map standings to include sport-specific fields
  const standings: Standing[] = rawStandings.map((s, idx) => ({
    position: idx + 1,
    team: s.team,
    played: s.played,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
    points: s.points,
    form: (s.form as ('W' | 'D' | 'L')[]) || [],
    // Sport-specific metrics (aliased from schema fields)
    goalsFor: s.goalsFor,
    goalsAgainst: s.goalsAgainst,
    goalDifference: s.goalDifference,
    pointsFor: s.goalsFor, // Alias for rugby/basketball
    pointsAgainst: s.goalsAgainst,
    pointDifference: s.goalDifference,
    triesFor: s.triesFor || 0,
    bonusPoints: s.bonusPoints || 0,
    netRunRate: s.netRunRate || 0,
    goalPercentage: s.goalsFor && (s.goalsFor + s.goalsAgainst) > 0 
      ? Math.round((s.goalsFor / (s.goalsFor + s.goalsAgainst)) * 100 * 10) / 10 
      : 0,
    percentage: s.goalsFor && s.goalsAgainst && s.goalsAgainst > 0
      ? Math.round((s.goalsFor / s.goalsAgainst) * 100 * 10) / 10
      : 0,
    winPercentage: s.played > 0 ? Math.round((s.won / s.played) * 100 * 10) / 10 : 0,
    scoresFor: s.goalsFor, // Alias for Gaelic
    scoresAgainst: s.goalsAgainst,
    scoreDifference: s.goalDifference,
  }));

  // Calculate stats
  const totalScored = matches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);
  const avgPerMatch = matches.length > 0 ? Math.round((totalScored / matches.length) * 100) / 100 : 0;

  return {
    id: league.id,
    name: league.name,
    code: league.code,
    sport: league.sport as Sport,
    season: season?.name || 'Current Season',
    isPublic: league.visibility === 'PUBLIC',
    standings,
    displayColumns,
    stats: {
      totalTeams: standings.length,
      matchesPlayed: matches.length,
      totalScored,
      avgPerMatch,
    },
  };
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default async function LeagueStandingsPage({
  params,
}: {
  params: { leagueId: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await getLeagueStandings(params.leagueId);

  if (!data) {
    notFound();
  }

  // Check access for private leagues
  if (!data.isPublic && !session?.user) {
    notFound();
  }

  const sportConfig = SPORT_CONFIG[data.sport];

  // Build column config for display
  const columnsConfig = data.displayColumns
    .filter(key => COLUMN_DEFINITIONS[key])
    .map(key => ({
      key,
      ...COLUMN_DEFINITIONS[key],
    }));

  return (
    <StandingsClient
      leagueId={params.leagueId}
      leagueName={data.name}
      leagueCode={data.code}
      sport={data.sport}
      sportConfig={sportConfig}
      season={data.season}
      standings={data.standings}
      columns={columnsConfig}
      stats={data.stats}
    />
  );
}