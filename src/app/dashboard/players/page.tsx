// ============================================================================
// 👥 PITCHCONNECT - TEAM PLAYERS PAGE
// ============================================================================
// Comprehensive team roster management with multi-sport position support
// Schema v7.2.0 aligned
// ============================================================================

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PlayersClient } from './PlayersClient';

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
    title: team ? `${team.name} - Squad` : 'Team Squad',
    description: 'View and manage team roster',
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTeamPlayersData(teamId: string, clubId: string, userId: string) {
  // Verify team and get with club info
  const team = await prisma.team.findFirst({
    where: { id: teamId, clubId: clubId },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
          teamType: true,
          settings: true,
        },
      },
    },
  });

  if (!team) return null;

  // Check membership
  const membership = await prisma.clubMember.findFirst({
    where: { clubId: clubId, userId: userId, status: 'ACTIVE' },
    include: { role: true },
  });

  if (!membership) return null;

  const canManagePlayers = ['OWNER', 'ADMIN', 'MANAGER', 'COACH'].includes(
    membership.role?.name || ''
  );

  // Get team players with full details
  const teamPlayers = await prisma.teamPlayer.findMany({
    where: { teamId: teamId },
    include: {
      player: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              dateOfBirth: true,
              phone: true,
            },
          },
          injuries: {
            where: { status: { in: ['ACTIVE', 'RECOVERING'] } },
            select: { id: true, severity: true, status: true, expectedReturnDate: true },
          },
          contracts: {
            where: { status: 'ACTIVE' },
            select: { id: true, endDate: true },
          },
          // Season statistics
          statistics: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          // Aggregate stats
          aggregateStats: {
            take: 1,
          },
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { position: 'asc' },
      { jerseyNumber: 'asc' },
    ],
  });

  // Get pending join requests (if manager can view)
  const pendingRequests = canManagePlayers
    ? await prisma.teamJoinRequest.findMany({
        where: { teamId: teamId, status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  // Calculate team statistics
  const stats = {
    total: teamPlayers.length,
    active: teamPlayers.filter((tp) => tp.status === 'ACTIVE').length,
    onLoan: teamPlayers.filter((tp) => tp.status === 'ON_LOAN').length,
    injured: teamPlayers.filter((tp) => tp.player.injuries.length > 0).length,
    byPosition: teamPlayers.reduce((acc, tp) => {
      const pos = tp.position || 'UNASSIGNED';
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageAge: calculateAverageAge(teamPlayers),
  };

  return {
    team,
    teamPlayers,
    pendingRequests,
    stats,
    permissions: {
      canManagePlayers,
      canViewContracts: ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role?.name || ''),
      userRole: membership.role?.name || 'VIEWER',
    },
    sport: team.club.sport,
  };
}

function calculateAverageAge(players: any[]): number {
  const ages = players
    .filter((tp) => tp.player.user.dateOfBirth)
    .map((tp) => {
      const dob = new Date(tp.player.user.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    });

  if (ages.length === 0) return 0;
  return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function PlayersPage({
  params,
}: {
  params: { clubId: string; teamId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      '/auth/signin?callbackUrl=' +
        encodeURIComponent(
          `/dashboard/manager/clubs/${params.clubId}/teams/${params.teamId}/players`
        )
    );
  }

  const data = await getTeamPlayersData(params.teamId, params.clubId, session.user.id);

  if (!data) {
    notFound();
  }

  return (
    <Suspense fallback={<PlayersPageSkeleton />}>
      <PlayersClient
        team={data.team}
        teamPlayers={data.teamPlayers}
        pendingRequests={data.pendingRequests}
        stats={data.stats}
        permissions={data.permissions}
        sport={data.sport}
      />
    </Suspense>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function PlayersPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  );
}