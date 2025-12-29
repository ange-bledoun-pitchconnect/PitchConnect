// ============================================================================
// 🔌 MATCH RESULT API ROUTE v7.4.0
// ============================================================================
// /api/matches/[matchId]/result - Record match result
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const resultSchema = z.object({
  homeScore: z.number().min(0),
  awayScore: z.number().min(0),
  homeHalftimeScore: z.number().nullable().optional(),
  awayHalftimeScore: z.number().nullable().optional(),
  homeExtraTimeScore: z.number().nullable().optional(),
  awayExtraTimeScore: z.number().nullable().optional(),
  homePenalties: z.number().nullable().optional(),
  awayPenalties: z.number().nullable().optional(),
  homeScoreBreakdown: z.record(z.number()).nullable().optional(),
  awayScoreBreakdown: z.record(z.number()).nullable().optional(),
  status: z.enum([
    'FINISHED', 'ABANDONED', 'CANCELLED', 'POSTPONED', 'VOIDED',
  ]),
  attendance: z.number().nullable().optional(),
  matchReport: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// PUT /api/matches/[matchId]/result
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get match
    const match = await prisma.match.findUnique({
      where: { id: params.matchId, deletedAt: null },
      select: {
        homeClubId: true,
        awayClubId: true,
        status: true,
        homeScore: true,
        awayScore: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: { in: [match.homeClubId, match.awayClubId] },
        isActive: true,
        deletedAt: null,
        OR: [
          { role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] } },
          { canManageMatches: true },
        ],
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to record results' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = resultSchema.parse(body);

    // Update match with result
    const updatedMatch = await prisma.match.update({
      where: { id: params.matchId },
      data: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        homeHalftimeScore: data.homeHalftimeScore,
        awayHalftimeScore: data.awayHalftimeScore,
        homeExtraTimeScore: data.homeExtraTimeScore,
        awayExtraTimeScore: data.awayExtraTimeScore,
        homePenalties: data.homePenalties,
        awayPenalties: data.awayPenalties,
        homeScoreBreakdown: data.homeScoreBreakdown,
        awayScoreBreakdown: data.awayScoreBreakdown,
        status: data.status,
        attendance: data.attendance,
        matchReport: data.matchReport,
        notes: data.notes,
        endTime: new Date(),
        resultApprovalStatus: 'PENDING',
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        homeClub: { select: { id: true, name: true, shortName: true } },
        awayClub: { select: { id: true, name: true, shortName: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Match',
        entityId: params.matchId,
        changes: {
          before: { homeScore: match.homeScore, awayScore: match.awayScore, status: match.status },
          after: { homeScore: data.homeScore, awayScore: data.awayScore, status: data.status },
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Update competition standings if it's a league match
    if (updatedMatch.competitionId && data.status === 'FINISHED') {
      try {
        await updateCompetitionStandings(
          updatedMatch.competitionId,
          updatedMatch.homeTeamId,
          updatedMatch.awayTeamId,
          data.homeScore,
          data.awayScore,
          data.homeScoreBreakdown,
          data.awayScoreBreakdown
        );
      } catch (standingsError) {
        console.error('Failed to update standings:', standingsError);
        // Don't fail the request if standings update fails
      }
    }

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    console.error('PUT /api/matches/[matchId]/result error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record result' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Update Competition Standings
// ============================================================================

async function updateCompetitionStandings(
  competitionId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  homeScoreBreakdown: Record<string, number> | null | undefined,
  awayScoreBreakdown: Record<string, number> | null | undefined
) {
  // Determine winner
  const homeWin = homeScore > awayScore;
  const awayWin = awayScore > homeScore;
  const draw = homeScore === awayScore;

  // Points (standard 3-1-0)
  const homePoints = homeWin ? 3 : draw ? 1 : 0;
  const awayPoints = awayWin ? 3 : draw ? 1 : 0;

  // Update home team standing
  await prisma.competitionStanding.upsert({
    where: {
      competitionId_teamId: { competitionId, teamId: homeTeamId },
    },
    update: {
      played: { increment: 1 },
      won: homeWin ? { increment: 1 } : undefined,
      drawn: draw ? { increment: 1 } : undefined,
      lost: awayWin ? { increment: 1 } : undefined,
      goalsFor: { increment: homeScore },
      goalsAgainst: { increment: awayScore },
      goalDifference: { increment: homeScore - awayScore },
      points: { increment: homePoints },
      scoreBreakdown: homeScoreBreakdown || undefined,
    },
    create: {
      competitionId,
      teamId: homeTeamId,
      played: 1,
      won: homeWin ? 1 : 0,
      drawn: draw ? 1 : 0,
      lost: awayWin ? 1 : 0,
      goalsFor: homeScore,
      goalsAgainst: awayScore,
      goalDifference: homeScore - awayScore,
      points: homePoints,
      scoreBreakdown: homeScoreBreakdown,
    },
  });

  // Update away team standing
  await prisma.competitionStanding.upsert({
    where: {
      competitionId_teamId: { competitionId, teamId: awayTeamId },
    },
    update: {
      played: { increment: 1 },
      won: awayWin ? { increment: 1 } : undefined,
      drawn: draw ? { increment: 1 } : undefined,
      lost: homeWin ? { increment: 1 } : undefined,
      goalsFor: { increment: awayScore },
      goalsAgainst: { increment: homeScore },
      goalDifference: { increment: awayScore - homeScore },
      points: { increment: awayPoints },
      scoreBreakdown: awayScoreBreakdown || undefined,
    },
    create: {
      competitionId,
      teamId: awayTeamId,
      played: 1,
      won: awayWin ? 1 : 0,
      drawn: draw ? 1 : 0,
      lost: homeWin ? 1 : 0,
      goalsFor: awayScore,
      goalsAgainst: homeScore,
      goalDifference: awayScore - homeScore,
      points: awayPoints,
      scoreBreakdown: awayScoreBreakdown,
    },
  });
}
