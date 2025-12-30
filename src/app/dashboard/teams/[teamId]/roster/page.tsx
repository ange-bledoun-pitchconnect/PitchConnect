// ============================================================================
// 🏆 PITCHCONNECT - Team Roster Page Server Component
// ============================================================================
// Path: app/dashboard/teams/[teamId]/roster/page.tsx
// ============================================================================

import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import TeamRosterClient from './roster-client';

interface PageProps {
  params: { teamId: string };
}

async function getTeamData(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId, deletedAt: null },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
          logo: true,
          slug: true,
        },
      },
    },
  });
}

async function getTeamPlayers(teamId: string) {
  return prisma.teamPlayer.findMany({
    where: { teamId },
    include: {
      player: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
          aggregateStats: {
            select: {
              totalMatches: true,
              totalGoals: true,
              totalAssists: true,
              avgRating: true,
            },
          },
        },
      },
    },
    orderBy: [
      { isCaptain: 'desc' },
      { isViceCaptain: 'desc' },
      { jerseyNumber: 'asc' },
    ],
  });
}

async function getUserPermissions(userId: string, clubId: string) {
  const membership = await prisma.clubMember.findUnique({
    where: {
      userId_clubId: {
        userId,
        clubId,
      },
    },
    select: {
      role: true,
      canManageRoster: true,
    },
  });

  const canManageRoles = ['OWNER', 'MANAGER', 'HEAD_COACH'];
  
  return {
    canManageRoster: membership?.canManageRoster || canManageRoles.includes(membership?.role || ''),
    canEditPlayers: membership?.canManageRoster || canManageRoles.includes(membership?.role || ''),
  };
}

export default async function TeamRosterPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const team = await getTeamData(params.teamId);
  if (!team) {
    notFound();
  }

  const [players, permissions] = await Promise.all([
    getTeamPlayers(params.teamId),
    getUserPermissions(session.user.id, team.club.id),
  ]);

  return (
    <TeamRosterClient
      team={team}
      players={players}
      userPermissions={permissions}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const team = await getTeamData(params.teamId);
  if (!team) return { title: 'Team Not Found' };

  return {
    title: `${team.name} Roster | ${team.club.name} | PitchConnect`,
    description: `View the squad and roster for ${team.name}`,
  };
}