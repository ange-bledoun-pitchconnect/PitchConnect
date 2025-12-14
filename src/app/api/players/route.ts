// ============================================================================
// FILE: src/app/api/players/[playerId]/route.ts
// ============================================================================
// Player Detail - GET, PUT, DELETE

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requireAuth, userBelongsToTeam } from '@/lib/auth';
import { updatePlayerSchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playerId = params.playerId;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        stats: {
          orderBy: { season: 'desc' },
          take: 5,
        },
        injuries: {
          orderBy: { dateFrom: 'desc' },
          take: 10,
        },
        user: {
          select: {
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: player });
  } catch (error) {
    console.error('[Player GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const playerId = params.playerId;

    // Validate input
    const validatedData = updatePlayerSchema.parse(body);

    // Get player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check access
    if (player.userId !== user.id && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update player
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: validatedData,
      include: { stats: true },
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        performedById: user.id,
        action: 'USER_UPDATED',
        entityType: 'Player',
        entityId: playerId,
        changes: validatedData as any,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[Player PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const user = await requireAuth();
    const playerId = params.playerId;

    // Get player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check access
    if (player.userId !== user.id && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete player
    await prisma.player.delete({
      where: { id: playerId },
    });

    // Log activity
    await prisma.auditLog.create({
      data: {
        performedById: user.id,
        action: 'USER_DELETED',
        entityType: 'Player',
        entityId: playerId,
      },
    });

    return NextResponse.json(
      { message: 'Player deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Player DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}