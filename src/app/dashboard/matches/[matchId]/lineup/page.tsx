// ============================================================================
// 👥 PITCHCONNECT - MATCH LINEUP PAGE v7.3.0
// ============================================================================
// Path: src/app/dashboard/matches/[matchId]/lineup/page.tsx
// Server component for match lineup management
// Schema v7.3.0 aligned - Uses MatchSquad model
// ============================================================================

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ClubMemberRole, MatchStatus, Sport, FormationType, Position } from '@prisma/client';
import LineupClient from './LineupClient';

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
    title: `${match.homeTeam.name} vs ${match.awayTeam.name} - Lineup | PitchConnect`,
    description: `Team lineup for ${match.homeTeam.name} vs ${match.awayTeam.name}`,
  };
}

// ============================================================================
// TYPES
// ============================================================================

interface SquadPlayer {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  lineupPosition: number | null;
  shirtNumber: number | null;
  position: Position | null;
  status: string;
  isCaptain: boolean;
  notes: string | null;
  player: {
    id: string;
    primaryPosition: Position | null;
    secondaryPosition: Position | null;
    jerseyNumber: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
}

interface TeamLineupData {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  sport: Sport;
  primaryColor: string | null;
  secondaryColor: string | null;
  formation: FormationType | null;
  players: SquadPlayer[];
}

interface MatchLineupData {
  id: string;
  status: MatchStatus;
  kickOffTime: Date;
  venue: string | null;
  homeClubId: string;
  awayClubId: string;
  homeFormation: FormationType | null;
  awayFormation: FormationType | null;
  homeTeam: TeamLineupData;
  awayTeam: TeamLineupData;
}

// ============================================================================
// PERMISSIONS
// ============================================================================

const MANAGE_LINEUP_ROLES: ClubMemberRole[] = [
  'OWNER',
  'MANAGER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
];

async function canManageLineup(
  userId: string,
  homeClubId: string,
  awayClubId: string
): Promise<{ canManage: boolean; managedClubId: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    return { canManage: true, managedClubId: homeClubId }; // SuperAdmin manages home by default
  }

  // Check home club membership
  const homeMembership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId: homeClubId,
      isActive: true,
      role: { in: MANAGE_LINEUP_ROLES },
    },
  });

  if (homeMembership) {
    return { canManage: true, managedClubId: homeClubId };
  }

  // Check away club membership
  const awayMembership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId: awayClubId,
      isActive: true,
      role: { in: MANAGE_LINEUP_ROLES },
    },
  });

  if (awayMembership) {
    return { canManage: true, managedClubId: awayClubId };
  }

  return { canManage: false, managedClubId: null };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getMatchLineupData(matchId: string): Promise<MatchLineupData | null> {
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
          secondaryColor: true,
          formation: true,
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
          secondaryColor: true,
          formation: true,
        },
      },
      squads: {
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
            },
          },
        },
        orderBy: [{ status: 'asc' }, { lineupPosition: 'asc' }],
      },
    },
  });

  if (!match) return null;

  // Separate squad by team
  const homeSquad = match.squads.filter((s) => s.teamId === match.homeTeamId);
  const awaySquad = match.squads.filter((s) => s.teamId === match.awayTeamId);

  return {
    id: match.id,
    status: match.status,
    kickOffTime: match.kickOffTime,
    venue: match.venue,
    homeClubId: match.homeClubId,
    awayClubId: match.awayClubId,
    homeFormation: match.homeFormation,
    awayFormation: match.awayFormation,
    homeTeam: {
      ...match.homeTeam,
      players: homeSquad,
    },
    awayTeam: {
      ...match.awayTeam,
      players: awaySquad,
    },
  };
}

async function getAvailablePlayers(clubId: string, teamId: string) {
  // Get all players from teams in this club
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: {
      teamId,
      isActive: true,
      status: { in: ['ACTIVE', 'ON_LOAN_IN'] },
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
        },
      },
    },
  });

  return teamPlayers.map((tp) => ({
    id: tp.player.id,
    name: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
    avatar: tp.player.user.avatar,
    position: tp.player.primaryPosition,
    secondaryPosition: tp.player.secondaryPosition,
    jerseyNumber: tp.jerseyNumber || tp.player.jerseyNumber,
  }));
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function LineupPage({
  params,
}: {
  params: { matchId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/dashboard/matches/${params.matchId}/lineup`);
  }

  const match = await getMatchLineupData(params.matchId);

  if (!match) {
    notFound();
  }

  const { canManage, managedClubId } = await canManageLineup(
    session.user.id,
    match.homeClubId,
    match.awayClubId
  );

  // Get available players for both teams
  const [homeAvailable, awayAvailable] = await Promise.all([
    getAvailablePlayers(match.homeClubId, match.homeTeam.id),
    getAvailablePlayers(match.awayClubId, match.awayTeam.id),
  ]);

  // Serialize dates for client
  const serializedMatch = {
    ...match,
    kickOffTime: match.kickOffTime.toISOString(),
    homeTeam: {
      ...match.homeTeam,
      players: match.homeTeam.players.map((p) => ({
        ...p,
        player: {
          ...p.player,
          user: p.player.user,
        },
      })),
    },
    awayTeam: {
      ...match.awayTeam,
      players: match.awayTeam.players.map((p) => ({
        ...p,
        player: {
          ...p.player,
          user: p.player.user,
        },
      })),
    },
  };

  return (
    <LineupClient
      match={serializedMatch}
      homeAvailablePlayers={homeAvailable}
      awayAvailablePlayers={awayAvailable}
      canManageLineup={canManage}
      managedClubId={managedClubId}
      currentUserId={session.user.id}
    />
  );
}
