// ============================================================================
// ⚽ PITCHCONNECT - MATCH EVENTS PAGE v7.3.0
// ============================================================================
// Path: src/app/dashboard/matches/[matchId]/events/page.tsx
// Server component for match event tracking
// Schema v7.3.0 aligned - Uses correct Prisma field names
// ============================================================================

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ClubMemberRole, MatchStatus, Sport } from '@prisma/client';
import MatchEventsClient from './MatchEventsClient';

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: { matchId: string };
}): Promise<Metadata> {
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });

  if (!match) {
    return { title: 'Match Not Found | PitchConnect' };
  }

  return {
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} - Events | PitchConnect`,
    description: `Live match events and statistics for ${match.homeTeam.name} vs ${match.awayTeam.name}`,
  };
}

// ============================================================================
// TYPES
// ============================================================================

interface MatchEventData {
  id: string;
  matchId: string;
  playerId: string | null;
  eventType: string;
  minute: number;
  secondaryMinute: number | null;
  period: string | null;
  relatedPlayerId: string | null;
  assistPlayerId: string | null;
  goalType: string | null;
  cardReason: string | null;
  details: Record<string, any> | null;
  videoTimestamp: number | null;
  createdAt: Date;
}

interface LineupPlayer {
  id: string;
  lineupPosition: number | null;
  shirtNumber: number | null;
  status: string;
  player?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
    primaryPosition: string | null;
    jerseyNumber: number | null;
  };
}

interface MatchData {
  id: string;
  status: MatchStatus;
  kickOffTime: Date;
  homeScore: number | null;
  awayScore: number | null;
  homeHalftimeScore: number | null;
  awayHalftimeScore: number | null;
  venue: string | null;
  homeClubId: string;
  awayClubId: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    sport: Sport;
    primaryColor: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    sport: Sport;
    primaryColor: string | null;
  };
  events: MatchEventData[];
  squads: LineupPlayer[];
}

// ============================================================================
// PERMISSION CHECK
// ============================================================================

const MANAGE_EVENTS_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'ANALYST',
  'VIDEO_ANALYST',
];

async function canManageEvents(userId: string, homeClubId: string, awayClubId: string): Promise<boolean> {
  // Check if user is SuperAdmin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, roles: true },
  });

  if (user?.isSuperAdmin) return true;

  // Check if user has referee role (can manage all match events)
  if (user?.roles?.includes('REFEREE')) return true;

  // Check club membership for either team
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      isActive: true,
      clubId: { in: [homeClubId, awayClubId] },
      role: { in: MANAGE_EVENTS_ROLES },
    },
  });

  return !!membership;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getMatchData(matchId: string): Promise<MatchData | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          sport: true,
          primaryColor: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          sport: true,
          primaryColor: true,
        },
      },
      events: {
        orderBy: [{ minute: 'asc' }, { createdAt: 'asc' }],
      },
      squads: {
        where: {
          status: {
            in: ['STARTING_LINEUP', 'SUBSTITUTE', 'CONFIRMED'],
          },
        },
        include: {
          team: {
            include: {
              players: {
                where: { isActive: true },
                include: {
                  player: {
                    include: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          avatar: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!match) return null;

  return {
    id: match.id,
    status: match.status,
    kickOffTime: match.kickOffTime,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeHalftimeScore: match.homeHalftimeScore,
    awayHalftimeScore: match.awayHalftimeScore,
    venue: match.venue,
    homeClubId: match.homeClubId,
    awayClubId: match.awayClubId,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    events: match.events.map((e) => ({
      ...e,
      details: e.details as Record<string, any> | null,
    })),
    squads: match.squads.map((s) => ({
      id: s.id,
      lineupPosition: s.lineupPosition,
      shirtNumber: s.shirtNumber,
      status: s.status,
    })),
  };
}

async function getTeamPlayers(homeClubId: string, awayClubId: string) {
  // Get players from teams belonging to these clubs
  const [homeTeams, awayTeams] = await Promise.all([
    prisma.team.findMany({
      where: { clubId: homeClubId, status: 'ACTIVE' },
      include: {
        players: {
          where: { isActive: true },
          include: {
            player: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.team.findMany({
      where: { clubId: awayClubId, status: 'ACTIVE' },
      include: {
        players: {
          where: { isActive: true },
          include: {
            player: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const formatPlayers = (teams: typeof homeTeams) => {
    const players: Array<{
      id: string;
      name: string;
      avatar: string | null;
      position: string | null;
      jerseyNumber: number | null;
    }> = [];

    for (const team of teams) {
      for (const tp of team.players) {
        if (tp.player) {
          players.push({
            id: tp.player.id,
            name: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
            avatar: tp.player.user.avatar,
            position: tp.player.primaryPosition,
            jerseyNumber: tp.jerseyNumber || tp.player.jerseyNumber,
          });
        }
      }
    }

    return players;
  };

  return {
    homePlayers: formatPlayers(homeTeams),
    awayPlayers: formatPlayers(awayTeams),
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function MatchEventsPage({
  params,
}: {
  params: { matchId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/dashboard/matches/${params.matchId}/events`);
  }

  const match = await getMatchData(params.matchId);

  if (!match) {
    notFound();
  }

  const canEdit = await canManageEvents(session.user.id, match.homeClubId, match.awayClubId);
  const { homePlayers, awayPlayers } = await getTeamPlayers(match.homeClubId, match.awayClubId);

  // Serialize dates for client component
  const serializedMatch = {
    ...match,
    kickOffTime: match.kickOffTime.toISOString(),
    events: match.events.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  };

  return (
    <MatchEventsClient
      match={serializedMatch}
      homePlayers={homePlayers}
      awayPlayers={awayPlayers}
      canManageEvents={canEdit}
      currentUserId={session.user.id}
    />
  );
}
