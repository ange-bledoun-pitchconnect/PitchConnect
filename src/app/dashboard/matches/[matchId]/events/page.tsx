// ============================================================================
// ⚽ PITCHCONNECT - MATCH EVENTS PAGE
// ============================================================================
// Real-time match event tracking with sport-specific event types
// Live scoring, timeline, and analytics
// Schema v7.2.0 aligned
// ============================================================================

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MatchEventsClient } from './MatchEventsClient';

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: { clubId: string; teamId: string; matchId: string };
}): Promise<Metadata> {
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });

  if (!match) {
    return { title: 'Match Not Found' };
  }

  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} - Match Events`,
    description: 'Track match events in real-time',
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getMatchEventData(
  matchId: string,
  teamId: string,
  clubId: string,
  userId: string
) {
  // Verify match exists and user has access
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ],
    },
    include: {
      homeTeam: {
        include: {
          club: {
            select: { id: true, name: true, sport: true },
          },
        },
      },
      awayTeam: {
        include: {
          club: {
            select: { id: true, name: true, sport: true },
          },
        },
      },
      competition: {
        select: { id: true, name: true },
      },
      venue: {
        select: { id: true, name: true },
      },
      events: {
        orderBy: { minute: 'asc' },
        include: {
          player: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          assistPlayer: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      lineups: {
        include: {
          player: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!match) return null;

  // Check user permissions
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId: clubId,
      userId: userId,
      status: 'ACTIVE',
    },
    include: {
      role: true,
    },
  });

  if (!membership) return null;

  const canManageEvents = ['OWNER', 'ADMIN', 'MANAGER', 'COACH'].includes(
    membership.role?.name || ''
  );

  // Get available players for event logging
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
        },
      },
    },
    orderBy: { jerseyNumber: 'asc' },
  });

  // Calculate current score from events
  const sport = match.homeTeam.club.sport;
  const score = calculateScore(match.events, match.homeTeamId, match.awayTeamId, sport);

  return {
    match: {
      ...match,
      currentScore: score,
    },
    teamPlayers,
    permissions: {
      canManageEvents,
      userRole: membership.role?.name || 'VIEWER',
    },
    sport,
  };
}

// Calculate score based on events
function calculateScore(
  events: any[],
  homeTeamId: string,
  awayTeamId: string,
  sport: string
): { home: number; away: number } {
  const scoringEvents: Record<string, Record<string, number>> = {
    FOOTBALL: { GOAL: 1, OWN_GOAL: 1, PENALTY_SCORED: 1 },
    RUGBY: { TRY: 5, CONVERSION: 2, PENALTY_GOAL: 3, DROP_GOAL: 3 },
    BASKETBALL: { GOAL: 2, THREE_POINTER: 3 },
    AMERICAN_FOOTBALL: { TOUCHDOWN: 6, FIELD_GOAL: 3, SAFETY_SCORE: 2 },
    HOCKEY: { GOAL: 1 },
    NETBALL: { GOAL: 1 },
    CRICKET: { BOUNDARY: 4 },
    LACROSSE: { GOAL: 1 },
    AUSTRALIAN_RULES: { GOAL: 6 },
    GAELIC_FOOTBALL: { GOAL: 3 },
    FUTSAL: { GOAL: 1, PENALTY_SCORED: 1 },
    BEACH_FOOTBALL: { GOAL: 1, PENALTY_SCORED: 1 },
  };

  const sportScoring = scoringEvents[sport] || { GOAL: 1 };
  let homeScore = 0;
  let awayScore = 0;

  events.forEach((event) => {
    const points = sportScoring[event.eventType] || 0;
    if (points > 0) {
      // Handle own goals (scored for opposing team)
      if (event.eventType === 'OWN_GOAL') {
        if (event.teamId === homeTeamId) {
          awayScore += points;
        } else {
          homeScore += points;
        }
      } else {
        if (event.teamId === homeTeamId) {
          homeScore += points;
        } else if (event.teamId === awayTeamId) {
          awayScore += points;
        }
      }
    }
  });

  return { home: homeScore, away: awayScore };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function MatchEventsPage({
  params,
}: {
  params: { clubId: string; teamId: string; matchId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      '/auth/signin?callbackUrl=' +
        encodeURIComponent(
          `/dashboard/manager/clubs/${params.clubId}/teams/${params.teamId}/matches/${params.matchId}/events`
        )
    );
  }

  const data = await getMatchEventData(
    params.matchId,
    params.teamId,
    params.clubId,
    session.user.id
  );

  if (!data) {
    notFound();
  }

  return (
    <Suspense fallback={<MatchEventsPageSkeleton />}>
      <MatchEventsClient
        match={data.match}
        teamPlayers={data.teamPlayers}
        permissions={data.permissions}
        sport={data.sport}
        currentTeamId={params.teamId}
      />
    </Suspense>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function MatchEventsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Score Header */}
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />

      {/* Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}