// ============================================================================
// ➕ CREATE MATCH PAGE v7.4.0
// ============================================================================
// /dashboard/matches/create - Multi-sport match creation
// ============================================================================

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MatchForm } from '@/components/forms/match-form';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Create Match | PitchConnect',
  description: 'Create a new match for your club',
};

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getFormData(userId: string) {
  // Get user's club memberships with permission to create matches
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
      isActive: true,
      deletedAt: null,
      OR: [
        { role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] } },
        { canManageMatches: true },
        { canCreateFriendlyMatches: true },
      ],
    },
    select: {
      clubId: true,
      role: true,
      canManageMatches: true,
      canCreateFriendlyMatches: true,
    },
  });

  if (memberships.length === 0) {
    return null;
  }

  const clubIds = memberships.map((m) => m.clubId);

  // Fetch all related data in parallel
  const [clubs, teams, competitions, venues, facilities, coach] = await Promise.all([
    // Clubs user has access to
    prisma.club.findMany({
      where: {
        id: { in: clubIds },
        deletedAt: null,
      },
      select: {
        id: true,
        organisationId: true,
        name: true,
        slug: true,
        shortName: true,
        logo: true,
        banner: true,
        sport: true,
        primaryColor: true,
        secondaryColor: true,
        city: true,
        country: true,
      },
      orderBy: { name: 'asc' },
    }),

    // Teams from those clubs
    prisma.team.findMany({
      where: {
        clubId: { in: clubIds },
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        clubId: true,
        name: true,
        description: true,
        logo: true,
        ageGroup: true,
        gender: true,
        status: true,
        defaultFormation: true,
      },
      orderBy: [{ clubId: 'asc' }, { name: 'asc' }],
    }),

    // Active competitions
    prisma.competition.findMany({
      where: {
        OR: [
          { clubId: { in: clubIds } },
          { organisationId: { in: clubIds } },
          {
            teams: {
              some: {
                clubId: { in: clubIds },
              },
            },
          },
        ],
        deletedAt: null,
        status: { in: ['DRAFT', 'ACTIVE', 'IN_PROGRESS'] },
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
        sport: true,
        type: true,
        format: true,
        status: true,
        logo: true,
      },
      orderBy: { name: 'asc' },
    }),

    // External venues
    prisma.venue.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        type: true,
        address: true,
        city: true,
        country: true,
        capacity: true,
        surface: true,
      },
      orderBy: { name: 'asc' },
      take: 100,
    }),

    // Club facilities
    prisma.facility.findMany({
      where: {
        organisation: {
          clubs: {
            some: {
              id: { in: clubIds },
            },
          },
        },
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        city: true,
        capacity: true,
      },
      orderBy: { name: 'asc' },
    }),

    // Check if user is a coach
    prisma.coach.findUnique({
      where: { userId },
      select: { id: true },
    }),
  ]);

  // Determine default sport from clubs
  const defaultSport = clubs.length > 0 ? clubs[0].sport : 'FOOTBALL';

  return {
    clubs,
    teams,
    competitions,
    venues,
    facilities,
    coachId: coach?.id,
    defaultSport,
    memberships,
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function CreateMatchPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const formData = await getFormData(session.user.id);

  // No permission to create matches
  if (!formData) {
    return (
      <main className="container py-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Permission Required</CardTitle>
            <CardDescription>
              You don&apos;t have permission to create matches. Contact your club
              manager to request access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/matches">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Matches
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/matches" aria-label="Back to matches">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Match</h1>
          <p className="text-muted-foreground">
            Schedule a new match for your team
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <MatchForm
          mode="create"
          clubs={formData.clubs}
          teams={formData.teams}
          competitions={formData.competitions}
          venues={formData.venues}
          facilities={formData.facilities}
          defaultSport={formData.defaultSport}
          userId={session.user.id}
          coachId={formData.coachId}
        />
      </div>
    </main>
  );
}
