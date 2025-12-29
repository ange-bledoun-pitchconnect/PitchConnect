// ============================================================================
// 🔌 MATCH LINEUP API ROUTE v7.4.0
// ============================================================================
// /api/matches/[matchId]/lineup - Manage match lineups
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const playerSchema = z.object({
  playerId: z.string().min(1),
  position: z.string().nullable().optional(),
  shirtNumber: z.number().nullable().optional(),
  lineupPosition: z.number().nullable().optional(),
});

const lineupSchema = z.object({
  starters: z.array(playerSchema),
  substitutes: z.array(playerSchema),
  captain: z.string().nullable().optional(),
  formation: z.string().nullable().optional(),
});

const updateLineupSchema = z.object({
  homeLineup: lineupSchema,
  awayLineup: lineupSchema,
});

// ============================================================================
// GET /api/matches/[matchId]/lineup
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.matchId, deletedAt: null },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeFormation: true,
        awayFormation: true,
        squads: {
          include: {
            player: {
              include: {
                user: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
          orderBy: [{ lineupPosition: 'asc' }],
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const homeSquad = match.squads.filter((s) => s.teamId === match.homeTeamId);
    const awaySquad = match.squads.filter((s) => s.teamId === match.awayTeamId);

    return NextResponse.json({
      homeLineup: {
        starters: homeSquad.filter((s) => s.status === 'STARTING_LINEUP'),
        substitutes: homeSquad.filter((s) => s.status === 'SUBSTITUTE'),
        captain: homeSquad.find((s) => s.isCaptain)?.playerId || null,
        formation: match.homeFormation,
      },
      awayLineup: {
        starters: awaySquad.filter((s) => s.status === 'STARTING_LINEUP'),
        substitutes: awaySquad.filter((s) => s.status === 'SUBSTITUTE'),
        captain: awaySquad.find((s) => s.isCaptain)?.playerId || null,
        formation: match.awayFormation,
      },
    });
  } catch (error) {
    console.error('GET /api/matches/[matchId]/lineup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lineup' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/matches/[matchId]/lineup
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
        homeTeamId: true,
        awayTeamId: true,
        status: true,
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
          { role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] } },
          { canManageLineups: true },
        ],
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to manage lineups' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateLineupSchema.parse(body);

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing squads
      await tx.matchSquad.deleteMany({
        where: { matchId: params.matchId },
      });

      // Create home team starters
      for (let i = 0; i < data.homeLineup.starters.length; i++) {
        const player = data.homeLineup.starters[i];
        await tx.matchSquad.create({
          data: {
            matchId: params.matchId,
            teamId: match.homeTeamId,
            playerId: player.playerId,
            position: player.position as any || null,
            shirtNumber: player.shirtNumber,
            lineupPosition: player.lineupPosition || i + 1,
            status: 'STARTING_LINEUP',
            isCaptain: player.playerId === data.homeLineup.captain,
          },
        });
      }

      // Create home team substitutes
      for (let i = 0; i < data.homeLineup.substitutes.length; i++) {
        const player = data.homeLineup.substitutes[i];
        await tx.matchSquad.create({
          data: {
            matchId: params.matchId,
            teamId: match.homeTeamId,
            playerId: player.playerId,
            position: player.position as any || null,
            shirtNumber: player.shirtNumber,
            status: 'SUBSTITUTE',
            substituteOrder: i + 1,
            isCaptain: false,
          },
        });
      }

      // Create away team starters
      for (let i = 0; i < data.awayLineup.starters.length; i++) {
        const player = data.awayLineup.starters[i];
        await tx.matchSquad.create({
          data: {
            matchId: params.matchId,
            teamId: match.awayTeamId,
            playerId: player.playerId,
            position: player.position as any || null,
            shirtNumber: player.shirtNumber,
            lineupPosition: player.lineupPosition || i + 1,
            status: 'STARTING_LINEUP',
            isCaptain: player.playerId === data.awayLineup.captain,
          },
        });
      }

      // Create away team substitutes
      for (let i = 0; i < data.awayLineup.substitutes.length; i++) {
        const player = data.awayLineup.substitutes[i];
        await tx.matchSquad.create({
          data: {
            matchId: params.matchId,
            teamId: match.awayTeamId,
            playerId: player.playerId,
            position: player.position as any || null,
            shirtNumber: player.shirtNumber,
            status: 'SUBSTITUTE',
            substituteOrder: i + 1,
            isCaptain: false,
          },
        });
      }

      // Update match formations
      await tx.match.update({
        where: { id: params.matchId },
        data: {
          homeFormation: data.homeLineup.formation as any || null,
          awayFormation: data.awayLineup.formation as any || null,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/matches/[matchId]/lineup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update lineup' },
      { status: 500 }
    );
  }
}
