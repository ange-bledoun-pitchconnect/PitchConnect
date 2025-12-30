// ============================================================================
// 🏆 PITCHCONNECT - Team Rankings Page v7.6.0
// ============================================================================
// Path: app/dashboard/teams/[teamId]/rankings/page.tsx
// Server Component - Comprehensive team and player statistics
// ============================================================================

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RankingsClient } from './RankingsClient';
import { Sport } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winRate: number;
  form: string[];
  cleanSheets: number;
  // Sport-specific
  sportStats?: Record<string, number>;
}

interface PlayerRanking {
  id: string;
  name: string;
  avatarUrl: string | null;
  jerseyNumber: number | null;
  position: string | null;
  stats: Record<string, number>;
}

interface LeagueStandings {
  competitionId: string;
  competitionName: string;
  standings: StandingEntry[];
  teamPosition: number;
  totalTeams: number;
}

interface StandingEntry {
  teamId: string;
  team: { id: string; name: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface MatchResult {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: Date;
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: { teamId: string };
}): Promise<Metadata> {
  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    select: { name: true },
  });

  return {
    title: team ? `${team.name} - Rankings & Statistics` : 'Team Rankings',
    description: 'View comprehensive team statistics and player rankings',
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTeamRankingsData(teamId: string, userId: string) {
  // Verify team exists and get details
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
          logo: true,
        },
      },
    },
  });

  if (!team) return null;

  // Check user has access (member of club)
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId: team.clubId,
      userId: userId,
      isActive: true,
    },
  });

  if (!membership) return null;

  const sport = team.club.sport;

  // Get all team players with their aggregate stats
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: {
      teamId: teamId,
      isActive: true,
    },
    include: {
      player: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          aggregateStats: true,
          statistics: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  // Get completed matches for the team
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      status: 'FINISHED',
    },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      kickOffTime: true,
      homeScoreBreakdown: true,
      awayScoreBreakdown: true,
    },
    orderBy: { kickOffTime: 'desc' },
    take: 50,
  });

  // Calculate team statistics
  const teamStats = calculateTeamStats(matches, teamId, sport);

  // Calculate player rankings for different categories
  const playerRankings = calculatePlayerRankings(teamPlayers, sport);

  // Get league standings if in a competition
  const leagueStandings = await getLeagueStandings(teamId);

  return {
    team: {
      id: team.id,
      name: team.name,
      club: team.club,
      ageGroup: team.ageGroup,
      gender: team.gender,
    },
    teamStats,
    playerRankings,
    leagueStandings,
    matchHistory: matches.slice(0, 10).map((m) => ({
      id: m.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      scheduledAt: m.kickOffTime,
    })),
    sport,
  };
}

function calculateTeamStats(
  matches: any[],
  teamId: string,
  sport: Sport
): TeamStats {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  // Sport-specific stat tracking
  const sportStats: Record<string, number> = {};

  matches.forEach((match) => {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;

    goalsFor += teamScore || 0;
    goalsAgainst += opponentScore || 0;

    if (teamScore > opponentScore) wins++;
    else if (teamScore < opponentScore) losses++;
    else draws++;

    // Sport-specific breakdown
    if (sport === 'RUGBY' && match.homeScoreBreakdown) {
      const breakdown = isHome
        ? match.homeScoreBreakdown
        : match.awayScoreBreakdown;
      if (breakdown) {
        sportStats.tries = (sportStats.tries || 0) + (breakdown.tries || 0);
        sportStats.conversions =
          (sportStats.conversions || 0) + (breakdown.conversions || 0);
        sportStats.penalties =
          (sportStats.penalties || 0) + (breakdown.penalties || 0);
      }
    }
  });

  const played = matches.length;

  // Points calculation varies by sport
  let points = 0;
  if (sport === 'RUGBY') {
    // Rugby uses bonus points system
    points = wins * 4 + draws * 2;
  } else {
    // Standard football points
    points = wins * 3 + draws;
  }

  const goalDifference = goalsFor - goalsAgainst;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  // Calculate form (last 5 matches)
  const form = matches.slice(0, 5).map((match) => {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;
    if (teamScore > opponentScore) return 'W';
    if (teamScore < opponentScore) return 'L';
    return 'D';
  });

  // Clean sheets
  const cleanSheets = matches.filter((m) => {
    const isHome = m.homeTeamId === teamId;
    return isHome ? m.awayScore === 0 : m.homeScore === 0;
  }).length;

  return {
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
    winRate,
    form,
    cleanSheets,
    sportStats: Object.keys(sportStats).length > 0 ? sportStats : undefined,
  };
}

function calculatePlayerRankings(
  teamPlayers: any[],
  sport: Sport
): Record<string, PlayerRanking[]> {
  // Extract players with stats
  const playersWithStats = teamPlayers
    .filter((tp) => tp.player.aggregateStats || tp.player.statistics.length > 0)
    .map((tp) => {
      const stats = tp.player.aggregateStats || tp.player.statistics[0] || {};
      return {
        id: tp.player.id,
        name: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
        avatarUrl: tp.player.user.avatar,
        jerseyNumber: tp.jerseyNumber,
        position: tp.position,
        stats: {
          goals: stats.totalGoals || stats.goals || 0,
          assists: stats.totalAssists || stats.assists || 0,
          appearances: stats.totalMatches || stats.matches || 0,
          minutesPlayed: stats.totalMinutes || stats.minutesPlayed || 0,
          yellowCards: stats.totalYellowCards || stats.yellowCards || 0,
          redCards: stats.totalRedCards || stats.redCards || 0,
          cleanSheets: stats.totalCleanSheets || stats.cleanSheets || 0,
          // Sport-specific
          tries: stats.tries || 0,
          conversions: stats.conversions || 0,
          rebounds: stats.rebounds || 0,
          wickets: stats.wickets || 0,
          runs: stats.runs || 0,
          touchdowns: stats.touchdowns || 0,
        },
      };
    });

  // Base rankings (all sports)
  const rankings: Record<string, PlayerRanking[]> = {
    mostAppearances: [...playersWithStats]
      .sort((a, b) => b.stats.appearances - a.stats.appearances)
      .slice(0, 10),
    mostMinutes: [...playersWithStats]
      .sort((a, b) => b.stats.minutesPlayed - a.stats.minutesPlayed)
      .slice(0, 10),
    disciplinary: [...playersWithStats]
      .sort((a, b) => {
        const aPoints = a.stats.yellowCards + a.stats.redCards * 3;
        const bPoints = b.stats.yellowCards + b.stats.redCards * 3;
        return bPoints - aPoints;
      })
      .slice(0, 10),
  };

  // Sport-specific rankings
  switch (sport) {
    case 'FOOTBALL':
    case 'FUTSAL':
    case 'BEACH_FOOTBALL':
      rankings.topScorers = [...playersWithStats]
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, 10);
      rankings.topAssists = [...playersWithStats]
        .sort((a, b) => b.stats.assists - a.stats.assists)
        .slice(0, 10);
      rankings.cleanSheets = [...playersWithStats]
        .filter((p) => p.position === 'GOALKEEPER')
        .sort((a, b) => b.stats.cleanSheets - a.stats.cleanSheets)
        .slice(0, 10);
      break;

    case 'RUGBY':
    case 'GAELIC_FOOTBALL':
      rankings.topTries = [...playersWithStats]
        .sort((a, b) => b.stats.tries - a.stats.tries)
        .slice(0, 10);
      rankings.topConversions = [...playersWithStats]
        .sort((a, b) => b.stats.conversions - a.stats.conversions)
        .slice(0, 10);
      break;

    case 'BASKETBALL':
      rankings.topScorers = [...playersWithStats]
        .sort((a, b) => b.stats.goals - a.stats.goals) // Points in basketball
        .slice(0, 10);
      rankings.topRebounders = [...playersWithStats]
        .sort((a, b) => b.stats.rebounds - a.stats.rebounds)
        .slice(0, 10);
      rankings.topAssists = [...playersWithStats]
        .sort((a, b) => b.stats.assists - a.stats.assists)
        .slice(0, 10);
      break;

    case 'CRICKET':
      rankings.topRunScorers = [...playersWithStats]
        .sort((a, b) => b.stats.runs - a.stats.runs)
        .slice(0, 10);
      rankings.topWicketTakers = [...playersWithStats]
        .sort((a, b) => b.stats.wickets - a.stats.wickets)
        .slice(0, 10);
      break;

    case 'AMERICAN_FOOTBALL':
      rankings.topTouchdowns = [...playersWithStats]
        .sort((a, b) => b.stats.touchdowns - a.stats.touchdowns)
        .slice(0, 10);
      break;

    case 'NETBALL':
      rankings.topScorers = [...playersWithStats]
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, 10);
      break;

    case 'HOCKEY':
    case 'LACROSSE':
      rankings.topScorers = [...playersWithStats]
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, 10);
      rankings.topAssists = [...playersWithStats]
        .sort((a, b) => b.stats.assists - a.stats.assists)
        .slice(0, 10);
      break;

    case 'AUSTRALIAN_RULES':
      rankings.topScorers = [...playersWithStats]
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, 10);
      break;

    default:
      // Generic scoring for any sport
      rankings.topScorers = [...playersWithStats]
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, 10);
  }

  return rankings;
}

async function getLeagueStandings(teamId: string): Promise<LeagueStandings | null> {
  // Get competitions this team is part of
  const competitionTeam = await prisma.competitionTeam.findFirst({
    where: {
      teamId: teamId,
      isActive: true,
    },
    include: {
      competition: {
        include: {
          standings: {
            orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }],
            take: 20,
          },
        },
      },
    },
    orderBy: {
      competition: {
        startDate: 'desc',
      },
    },
  });

  if (!competitionTeam?.competition?.standings?.length) return null;

  const competition = competitionTeam.competition;

  // Get team names for standings
  const teamIds = competition.standings.map((s) => s.teamId).filter(Boolean);
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds as string[] } },
    select: { id: true, name: true },
  });

  const teamsMap = new Map(teams.map((t) => [t.id, t]));

  const standings = competition.standings.map((s) => ({
    teamId: s.teamId || '',
    team: teamsMap.get(s.teamId || '') || { id: s.teamId || '', name: 'Unknown' },
    played: s.played,
    won: s.wins,
    drawn: s.draws,
    lost: s.losses,
    goalsFor: s.goalsFor,
    goalsAgainst: s.goalsAgainst,
    goalDifference: s.goalDifference,
    points: s.points,
  }));

  const teamPosition = standings.findIndex((s) => s.teamId === teamId) + 1;

  return {
    competitionId: competition.id,
    competitionName: competition.name,
    standings,
    teamPosition: teamPosition || 0,
    totalTeams: standings.length,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function RankingsPage({
  params,
}: {
  params: { teamId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(
        `/dashboard/teams/${params.teamId}/rankings`
      )}`
    );
  }

  const data = await getTeamRankingsData(params.teamId, session.user.id);

  if (!data) {
    notFound();
  }

  return (
    <Suspense fallback={<RankingsPageSkeleton />}>
      <RankingsClient
        team={data.team}
        teamStats={data.teamStats}
        playerRankings={data.playerRankings}
        leagueStandings={data.leagueStandings}
        matchHistory={data.matchHistory}
        sport={data.sport}
      />
    </Suspense>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function RankingsPageSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div className="h-8 w-64 bg-zinc-800 rounded" />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl"
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-zinc-900 border border-zinc-800 rounded-xl" />
          <div className="h-96 bg-zinc-900 border border-zinc-800 rounded-xl" />
        </div>

        {/* Rankings Table */}
        <div className="h-[500px] bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}
