// ============================================================================
// 🏆 PITCHCONNECT - TEAM RANKINGS PAGE
// ============================================================================
// Comprehensive team statistics and player rankings with multi-sport metrics
// Schema v7.2.0 aligned
// ============================================================================

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RankingsClient } from './RankingsClient';

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: { clubId: string; teamId: string };
}): Promise<Metadata> {
  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    select: { name: true },
  });

  return {
    title: team ? `${team.name} - Rankings & Stats` : 'Team Rankings',
    description: 'View team statistics and player rankings',
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTeamRankingsData(teamId: string, clubId: string, userId: string) {
  // Verify team access
  const team = await prisma.team.findFirst({
    where: { id: teamId, clubId: clubId },
    include: {
      club: {
        select: { id: true, name: true, sport: true, settings: true },
      },
      season: {
        select: { id: true, name: true, startDate: true, endDate: true },
      },
    },
  });

  if (!team) return null;

  // Check membership
  const membership = await prisma.clubMember.findFirst({
    where: { clubId: clubId, userId: userId, status: 'ACTIVE' },
  });

  if (!membership) return null;

  const sport = team.club.sport;

  // Get all team players with their aggregate stats
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: {
      teamId: teamId,
      status: { in: ['ACTIVE', 'ON_LOAN'] },
    },
    include: {
      player: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          aggregateStats: {
            where: { seasonId: team.seasonId },
            take: 1,
          },
          statistics: {
            where: { seasonId: team.seasonId },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  // Get team match results for the season
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      status: 'COMPLETED',
      seasonId: team.seasonId,
    },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      scheduledAt: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });

  // Calculate team statistics
  const teamStats = calculateTeamStats(matches, teamId, sport);

  // Calculate player rankings for different categories
  const playerRankings = calculatePlayerRankings(teamPlayers, sport);

  // Get league standings if in a competition
  const leagueStandings = await getLeagueStandings(teamId);

  return {
    team,
    teamStats,
    playerRankings,
    leagueStandings,
    matchHistory: matches.slice(0, 10),
    sport,
  };
}

function calculateTeamStats(matches: any[], teamId: string, sport: string) {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  matches.forEach((match) => {
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;

    goalsFor += teamScore || 0;
    goalsAgainst += opponentScore || 0;

    if (teamScore > opponentScore) wins++;
    else if (teamScore < opponentScore) losses++;
    else draws++;
  });

  const played = matches.length;
  const points = wins * 3 + draws;
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
    cleanSheets: matches.filter((m) => {
      const isHome = m.homeTeamId === teamId;
      return isHome ? m.awayScore === 0 : m.homeScore === 0;
    }).length,
  };
}

function calculatePlayerRankings(teamPlayers: any[], sport: string) {
  // Extract players with stats
  const playersWithStats = teamPlayers
    .filter((tp) => tp.player.aggregateStats.length > 0)
    .map((tp) => ({
      id: tp.player.id,
      name: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
      avatarUrl: tp.player.user.avatarUrl,
      jerseyNumber: tp.jerseyNumber,
      position: tp.position,
      stats: tp.player.aggregateStats[0],
    }));

  // Create rankings for different categories
  const rankings = {
    topScorers: [...playersWithStats]
      .sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0))
      .slice(0, 10),
    topAssists: [...playersWithStats]
      .sort((a, b) => (b.stats.assists || 0) - (a.stats.assists || 0))
      .slice(0, 10),
    mostAppearances: [...playersWithStats]
      .sort((a, b) => (b.stats.appearances || 0) - (a.stats.appearances || 0))
      .slice(0, 10),
    mostMinutes: [...playersWithStats]
      .sort((a, b) => (b.stats.minutesPlayed || 0) - (a.stats.minutesPlayed || 0))
      .slice(0, 10),
    disciplinary: [...playersWithStats]
      .sort((a, b) => {
        const aPoints = (a.stats.yellowCards || 0) + (a.stats.redCards || 0) * 3;
        const bPoints = (b.stats.yellowCards || 0) + (b.stats.redCards || 0) * 3;
        return bPoints - aPoints;
      })
      .slice(0, 10),
  };

  // Add sport-specific rankings
  if (sport === 'RUGBY') {
    rankings['topTries'] = [...playersWithStats]
      .sort((a, b) => (b.stats.tries || 0) - (a.stats.tries || 0))
      .slice(0, 10);
  } else if (sport === 'BASKETBALL') {
    rankings['topRebounders'] = [...playersWithStats]
      .sort((a, b) => (b.stats.rebounds || 0) - (a.stats.rebounds || 0))
      .slice(0, 10);
  } else if (sport === 'CRICKET') {
    rankings['topWickets'] = [...playersWithStats]
      .sort((a, b) => (b.stats.wickets || 0) - (a.stats.wickets || 0))
      .slice(0, 10);
  }

  return rankings;
}

async function getLeagueStandings(teamId: string) {
  // Get competitions this team is part of
  const competitions = await prisma.competitionTeam.findMany({
    where: { teamId: teamId },
    include: {
      competition: {
        include: {
          standings: {
            orderBy: [{ points: 'desc' }, { goalDifference: 'desc' }],
            include: {
              team: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (competitions.length === 0) return null;

  // Return first competition's standings
  const competition = competitions[0].competition;
  const teamPosition = competition.standings.findIndex((s) => s.teamId === teamId) + 1;

  return {
    competitionId: competition.id,
    competitionName: competition.name,
    standings: competition.standings.slice(0, 10),
    teamPosition,
    totalTeams: competition.standings.length,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function RankingsPage({
  params,
}: {
  params: { clubId: string; teamId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      '/auth/signin?callbackUrl=' +
        encodeURIComponent(
          `/dashboard/manager/clubs/${params.clubId}/teams/${params.teamId}/rankings`
        )
    );
  }

  const data = await getTeamRankingsData(params.teamId, params.clubId, session.user.id);

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
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}