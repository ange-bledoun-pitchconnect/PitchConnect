// ============================================================================
// 🏥 PITCHCONNECT - TEAM INJURIES PAGE
// ============================================================================
// Enterprise-grade injury management with HIPAA-compliant access controls
// Multi-sport support, recovery tracking, and medical staff integration
// Schema v7.2.0 aligned
// ============================================================================

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { InjuriesClient } from './InjuriesClient';
import { canAccessInjuryData } from '@/lib/permissions';

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
    title: team ? `${team.name} - Injuries` : 'Team Injuries',
    description: 'Manage team injuries, recovery tracking, and medical records',
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTeamInjuryData(teamId: string, clubId: string, userId: string) {
  // Verify team exists and belongs to club
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      clubId: clubId,
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          sport: true,
          settings: true,
        },
      },
    },
  });

  if (!team) return null;

  // Get user's role and permissions for this club
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId: clubId,
      userId: userId,
      status: 'ACTIVE',
    },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!membership) return null;

  // Determine access level based on role
  const userRole = membership.role?.name || 'VIEWER';
  const canViewFullDetails = canAccessInjuryData(userRole, 'FULL');
  const canViewLimitedDetails = canAccessInjuryData(userRole, 'LIMITED');
  const canManageInjuries = canAccessInjuryData(userRole, 'MANAGE');

  // Fetch injuries with appropriate detail level
  const injuries = await prisma.injury.findMany({
    where: {
      player: {
        teamPlayers: {
          some: {
            teamId: teamId,
            status: { in: ['ACTIVE', 'ON_LOAN'] },
          },
        },
      },
    },
    include: {
      player: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          teamPlayers: {
            where: { teamId: teamId },
            select: {
              jerseyNumber: true,
              position: true,
            },
          },
        },
      },
      // Only include sensitive medical data for authorized roles
      ...(canViewFullDetails && {
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      }),
    },
    orderBy: [
      { status: 'asc' },
      { expectedReturnDate: 'asc' },
    ],
  });

  // Get team players for injury reporting
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
    orderBy: {
      player: {
        user: {
          lastName: 'asc',
        },
      },
    },
  });

  // Get injury statistics
  const stats = {
    total: injuries.length,
    active: injuries.filter(i => i.status === 'ACTIVE').length,
    recovering: injuries.filter(i => i.status === 'RECOVERING').length,
    cleared: injuries.filter(i => i.status === 'CLEARED').length,
    byBodyPart: injuries.reduce((acc, i) => {
      const part = i.bodyPart || 'Unknown';
      acc[part] = (acc[part] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    bySeverity: injuries.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Filter sensitive data if user doesn't have full access
  const sanitizedInjuries = injuries.map(injury => ({
    ...injury,
    // Mask specific diagnosis for limited access
    diagnosis: canViewFullDetails ? injury.diagnosis : '[Restricted]',
    treatmentPlan: canViewFullDetails ? injury.treatmentPlan : null,
    medicalRecords: canViewFullDetails ? injury.medicalRecords : [],
    // Always show these fields
    bodyPart: injury.bodyPart,
    severity: injury.severity,
    status: injury.status,
    injuryDate: injury.injuryDate,
    expectedReturnDate: injury.expectedReturnDate,
  }));

  return {
    team,
    injuries: sanitizedInjuries,
    teamPlayers,
    stats,
    permissions: {
      canViewFullDetails,
      canViewLimitedDetails,
      canManageInjuries,
      userRole,
    },
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function InjuriesPage({
  params,
}: {
  params: { clubId: string; teamId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=' + encodeURIComponent(`/dashboard/manager/clubs/${params.clubId}/teams/${params.teamId}/injuries`));
  }

  const data = await getTeamInjuryData(params.teamId, params.clubId, session.user.id);

  if (!data) {
    notFound();
  }

  // Check minimum access level
  if (!data.permissions.canViewLimitedDetails) {
    redirect(`/dashboard/manager/clubs/${params.clubId}/teams/${params.teamId}`);
  }

  return (
    <Suspense fallback={<InjuriesPageSkeleton />}>
      <InjuriesClient
        team={data.team}
        injuries={data.injuries}
        teamPlayers={data.teamPlayers}
        stats={data.stats}
        permissions={data.permissions}
        sport={data.team.club.sport}
      />
    </Suspense>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function InjuriesPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="h-12 border-b border-gray-200 dark:border-gray-700" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-200 dark:border-gray-700" />
        ))}
      </div>
    </div>
  );
}