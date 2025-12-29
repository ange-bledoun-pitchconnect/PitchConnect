// ============================================================================
// 📋 PITCHCONNECT - MATCH LINEUP PAGE
// ============================================================================
// Visual lineup builder with sport-specific formations and positions
// Schema v7.2.0 aligned
// ============================================================================

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { LineupClient } from './LineupClient';

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

  return {
    title: match
      ? `${match.homeTeam.name} vs ${match.awayTeam.name} - Lineup`
      : 'Match Lineup',
    description: 'Set and manage match lineup',
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getLineupData(
  matchId: string,
  teamId: string,
  clubId: string,
  userId: string
) {
  // Get match with lineups
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: {
      homeTeam: {
        include: {
          club: { select: { id: true, name: true, sport: true } },
        },
      },
      awayTeam: {
        include: {
          club: { select: { id: true, name: true, sport: true } },
        },
      },
      competition: { select: { id: true, name: true } },
      venue: { select: { id: true, name: true } },
      lineups: {
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
              injuries: {
                where: { status: 'ACTIVE' },
                select: { id: true, severity: true },
              },
            },
          },
        },
      },
      formation: true,
    },
  });

  if (!match) return null;

  // Check permissions
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId: clubId,
      userId: userId,
      status: 'ACTIVE',
    },
    include: { role: true },
  });

  if (!membership) return null;

  const canManageLineup = ['OWNER', 'ADMIN', 'MANAGER', 'COACH'].includes(
    membership.role?.name || ''
  );

  // Get available players for lineup
  const availablePlayers = await prisma.teamPlayer.findMany({
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
          injuries: {
            where: { status: 'ACTIVE' },
            select: { id: true, severity: true, bodyPart: true },
          },
          // Get player availability for match date
          availability: {
            where: {
              date: {
                gte: new Date(new Date(match.scheduledAt).setHours(0, 0, 0, 0)),
                lte: new Date(new Date(match.scheduledAt).setHours(23, 59, 59, 999)),
              },
            },
          },
        },
      },
    },
    orderBy: [{ position: 'asc' }, { jerseyNumber: 'asc' }],
  });

  // Get saved formations for this team
  const savedFormations = await prisma.teamFormation.findMany({
    where: { teamId: teamId },
    orderBy: { name: 'asc' },
  });

  const sport = match.homeTeam.club.sport;
  const isHomeTeam = match.homeTeamId === teamId;

  // Separate lineup into starting XI and substitutes
  const teamLineup = match.lineups.filter((l) =>
    isHomeTeam ? l.teamId === match.homeTeamId : l.teamId === match.awayTeamId
  );

  return {
    match,
    lineup: {
      starting: teamLineup.filter((l) => l.isStarter),
      substitutes: teamLineup.filter((l) => !l.isStarter),
    },
    availablePlayers,
    savedFormations,
    permissions: { canManageLineup, userRole: membership.role?.name || 'VIEWER' },
    sport,
    isHomeTeam,
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function LineupPage({
  params,
}: {
  params: { clubId: string; teamId: string; matchId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      '/auth/signin?callbackUrl=' +
        encodeURIComponent(
          `/dashboard/manager/clubs/${params.clubId}/teams/${params.teamId}/matches/${params.matchId}/lineup`
        )
    );
  }

  const data = await getLineupData(
    params.matchId,
    params.teamId,
    params.clubId,
    session.user.id
  );

  if (!data) {
    notFound();
  }

  return (
    <Suspense fallback={<LineupPageSkeleton />}>
      <LineupClient
        match={data.match}
        lineup={data.lineup}
        availablePlayers={data.availablePlayers}
        savedFormations={data.savedFormations}
        permissions={data.permissions}
        sport={data.sport}
        isHomeTeam={data.isHomeTeam}
        teamId={params.teamId}
      />
    </Suspense>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LineupPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[600px] bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}