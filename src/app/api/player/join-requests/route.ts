// ============================================================================
// 🏆 PITCHCONNECT JOIN REQUESTS API v7.5.0
// ============================================================================
// POST /api/player/join-requests - Create team join request
// GET /api/player/join-requests - List player's join requests
// DELETE /api/player/join-requests/[id] - Cancel join request
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createJoinRequestSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
  preferredPosition: z.string().optional(),
  preferredJerseyNumber: z.number().int().min(1).max(99).optional(),
});

// ============================================================================
// POST - Create join request
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = createJoinRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { teamId, message, preferredPosition, preferredJerseyNumber } = validation.data;

    // Get player
    const player = await prisma.player.findFirst({
      where: { userId: session.user.id },
      include: {
        teamPlayers: {
          where: { isActive: true },
          select: { teamId: true },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player profile not found' },
        { status: 404 }
      );
    }

    // Check if already a member
    if (player.teamPlayers.some((tp) => tp.teamId === teamId)) {
      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existingRequest = await prisma.joinRequest.findFirst({
      where: {
        playerId: player.id,
        teamId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this team' },
        { status: 400 }
      );
    }

    // Check team exists and is recruiting
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        club: { select: { id: true, name: true, sport: true } },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (!team.isRecruiting) {
      return NextResponse.json(
        { error: 'This team is not currently accepting new players' },
        { status: 400 }
      );
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        playerId: player.id,
        teamId,
        clubId: team.clubId,
        message,
        preferredPosition,
        preferredJerseyNumber,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            club: { select: { id: true, name: true, sport: true } },
          },
        },
      },
    });

    // TODO: Send notification to team managers/coaches

    return NextResponse.json({
      success: true,
      joinRequest: {
        id: joinRequest.id,
        teamId: joinRequest.teamId,
        teamName: joinRequest.team.name,
        clubName: joinRequest.team.club.name,
        status: joinRequest.status,
        createdAt: joinRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Create join request error:', error);
    return NextResponse.json(
      { error: 'Failed to create join request' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - List player's join requests
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get player
    const player = await prisma.player.findFirst({
      where: { userId: session.user.id },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player profile not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = { playerId: player.id };
    if (status) {
      where.status = status;
    }

    // Fetch join requests
    const [joinRequests, total] = await Promise.all([
      prisma.joinRequest.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logo: true,
              ageGroup: true,
              gender: true,
              club: {
                select: {
                  id: true,
                  name: true,
                  sport: true,
                  logo: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.joinRequest.count({ where }),
    ]);

    return NextResponse.json({
      joinRequests: joinRequests.map((jr) => ({
        id: jr.id,
        teamId: jr.teamId,
        team: jr.team,
        status: jr.status,
        message: jr.message,
        preferredPosition: jr.preferredPosition,
        preferredJerseyNumber: jr.preferredJerseyNumber,
        rejectionReason: jr.rejectionReason,
        createdAt: jr.createdAt,
        reviewedAt: jr.reviewedAt,
        expiresAt: jr.expiresAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List join requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch join requests' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cancel join request
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request ID from URL
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get player
    const player = await prisma.player.findFirst({
      where: { userId: session.user.id },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player profile not found' },
        { status: 404 }
      );
    }

    // Find and validate join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (joinRequest.playerId !== player.id) {
      return NextResponse.json(
        { error: 'You can only cancel your own requests' },
        { status: 403 }
      );
    }

    // Can only cancel pending requests
    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending requests can be cancelled' },
        { status: 400 }
      );
    }

    // Update status to cancelled
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel join request error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel join request' },
      { status: 500 }
    );
  }
}
