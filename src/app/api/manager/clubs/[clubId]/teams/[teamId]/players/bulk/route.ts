// src/app/api/manager/clubs/[clubId]/teams/[teamId]/players/bulk/route.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clubId, teamId } = params;
    const body = await req.json();

    // Get manager profile
    const manager = await prisma.manager.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
    }

    // Verify access
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.managerId !== manager.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || team.clubId !== clubId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Validation
    if (!Array.isArray(body.players) || body.players.length === 0) {
      return NextResponse.json(
        { error: 'Players array is required and must not be empty' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
      players: [] as any[],
    };

    for (const playerData of body.players) {
      try {
        if (!playerData.email) {
          results.failed++;
          results.errors.push({
            email: playerData.email,
            error: 'Email is required',
          });
          continue;
        }

        // Find user by email
        const user = await prisma.user.findFirst({
          where: { email: playerData.email },
        });

        if (!user) {
          results.failed++;
          results.errors.push({
            email: playerData.email,
            error: 'User not found',
          });
          continue;
        }

        // Check if already on team
        const existing = await prisma.player.findFirst({
          where: {
            userId: user.id,
            teamId,
          },
        });

        if (existing) {
          results.failed++;
          results.errors.push({
            email: playerData.email,
            error: 'Player already on team',
          });
          continue;
        }

        // Create player
        const player = await prisma.player.create({
          data: {
            userId: user.id,
            teamId,
            position: playerData.position || null,
            jerseyNumber: playerData.jerseyNumber || null,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        results.success++;
        results.players.push(player);
      } catch (err) {
        results.failed++;
        results.errors.push({
          email: playerData.email,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error('POST /api/manager/clubs/[clubId]/teams/[teamId]/players/bulk error:', error);
    return NextResponse.json(
      {
        error: 'Failed to bulk import players',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
