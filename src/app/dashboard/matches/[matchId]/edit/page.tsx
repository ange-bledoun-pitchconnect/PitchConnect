// ============================================================================
// ✏️ EDIT MATCH PAGE v7.4.0
// ============================================================================
// /dashboard/matches/[matchId]/edit - Edit existing match
// ============================================================================

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MatchForm } from '@/components/forms/match-form';
import { LIVE_STATUSES } from '@/types/match';

// ============================================================================
// TYPES
// ============================================================================

interface PageProps {
  params: { matchId: string };
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      homeClub: { select: { name: true, shortName: true } },
      awayClub: { select: { name: true, shortName: true } },
    },
  });

  if (!match) {
    return { title: 'Match Not Found | PitchConnect' };
  }

  const title = match.title ||
    `${match.homeClub.shortName || match.homeClub.name} vs ${match.awayClub.shortName || match.awayClub.name}`;

  return {
    title: `Edit ${title} | PitchConnect`,
    description: `Edit match details for ${title}`,
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getMatch(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId, deletedAt: null },
    include: {
      homeTeam: {
        select: { id: true, name: true, clubId: true, logo: true },
      },
      awayTeam: {
        select: { id: true, name: true, clubId: true, logo: true },
      },
      homeClub: {
        select: { id: true, name: true, shortName: true, logo: true, sport: true },
      },
      awayClub: {
        select: { id: true, name: true, shortName: true, logo: true, sport: true },
      },
      competition: {
        select: { id: true, name: true, shortName: true, logo: true, type: true },
      },
      venueRelation: {
        select: { id: true, name: true, city: true },
      },
      facilityRelation: {
        select: { id: true, name: true, type: true },
      },
    },
  });
}

async function getFormData(userId: string, match: NonNullable<Awaited<ReturnType<typeof getMatch>>>) {
  // Get user's club memberships with permission to edit matches
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
      clubId: { in: [match.homeClubId, match.awayClubId] },
      isActive: true,
      deletedAt: null,
      OR: [
        { role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] } },
        { canManageMatches: true },
      ],
    },
    select: {
      clubId: true,
      role: true,
      canManageMatches: true,
    },
  });

  // Check if user can edit (is staff or creator)
  const canEdit = memberships.length > 0 || match.createdById === userId;

  if (!canEdit) {
    return null;
  }

  // Get all clubs user has access to (for team selection)
  const allMemberships = await prisma.clubMember.findMany({
    where: {
      userId,
      isActive: true,
      deletedAt: null,
    },
    select: { clubId: true },
  });

  const clubIds = [...new Set([
    ...allMemberships.map((m) => m.clubId),
    match.homeClubId,
    match.awayClubId,
  ])];

  // Fetch all related data
  const [clubs, teams, competitions, venues, facilities, coach] = await Promise.all([
    prisma.club.findMany({
      where: { id: { in: clubIds }, deletedAt: null },
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

    prisma.competition.findMany({
      where: {
        OR: [
          { clubId: { in: clubIds } },
          { id: match.competitionId || undefined },
        ],
        deletedAt: null,
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

    prisma.venue.findMany({
      where: { deletedAt: null, isActive: true },
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

    prisma.facility.findMany({
      where: {
        organisation: {
          clubs: { some: { id: { in: clubIds } } },
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

    prisma.coach.findUnique({
      where: { userId },
      select: { id: true },
    }),
  ]);

  return {
    clubs,
    teams,
    competitions,
    venues,
    facilities,
    coachId: coach?.id,
    defaultSport: match.homeClub.sport,
  };
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function EditMatchPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const match = await getMatch(params.matchId);

  if (!match) {
    notFound();
  }

  const formData = await getFormData(session.user.id, match);

  // No permission to edit
  if (!formData) {
    return (
      <main className="container py-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Permission Required</CardTitle>
            <CardDescription>
              You don&apos;t have permission to edit this match.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/dashboard/matches/${match.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Match
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isLive = LIVE_STATUSES.includes(match.status);
  const isFinished = match.status === 'FINISHED';

  return (
    <main className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/matches/${match.id}`} aria-label="Back to match">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Match</h1>
          <p className="text-muted-foreground">
            {match.title || `${match.homeClub.shortName || match.homeClub.name} vs ${match.awayClub.shortName || match.awayClub.name}`}
          </p>
        </div>
      </div>

      {/* Warning for live/finished matches */}
      {(isLive || isFinished) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {isLive ? 'Match is Live' : 'Match has Finished'}
          </AlertTitle>
          <AlertDescription>
            {isLive
              ? 'This match is currently in progress. Some fields may be locked.'
              : 'This match has finished. Only limited fields can be edited.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <div className="max-w-4xl">
        <MatchForm
          mode="edit"
          match={match as any}
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
