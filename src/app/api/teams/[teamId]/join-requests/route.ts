// ============================================================================
// 🤝 JOIN REQUEST API ROUTES - PitchConnect v7.3.0
// ============================================================================
// RESTful API endpoints for team join requests
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// ============================================================================
// GET /api/teams/[teamId]/join-requests - List join requests for a team
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { teamId } = params;
    const { searchParams } = new URL(request.url);

    // Verify team exists and get club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } },
        { status: 404 }
      );
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: team.clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No permission to view join requests' } },
        { status: 403 }
      );
    }

    // Parse query parameters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TeamJoinRequestWhereInput = { teamId };

    if (status) {
      const statuses = status.split(',');
      where.status = statuses.length === 1 ? statuses[0] as any : { in: statuses as any };
    }

    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { player: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { player: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Get total
    const total = await prisma.teamJoinRequest.count({ where });

    // Get requests
    const requests = await prisma.teamJoinRequest.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        message: true,
        position: true,
        experience: true,
        availability: true,
        createdAt: true,
        expiresAt: true,
        reviewedAt: true,
        player: {
          select: {
            id: true,
            primaryPosition: true,
            dateOfBirth: true,
            overallRating: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        data: requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + requests.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('GET /api/teams/[teamId]/join-requests error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch join requests' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/teams/[teamId]/join-requests - Create join request
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { teamId } = params;
    const body = await request.json();

    // Get player profile
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Player profile required' } },
        { status: 400 }
      );
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: { teamId, playerId: player.id },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Already a team member' } },
        { status: 409 }
      );
    }

    // Check for pending request
    const existingRequest = await prisma.teamJoinRequest.findFirst({
      where: {
        teamId,
        playerId: player.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Pending request already exists' } },
        { status: 409 }
      );
    }

    // Create request
    const joinRequest = await prisma.teamJoinRequest.create({
      data: {
        teamId,
        playerId: player.id,
        message: body.message,
        position: body.position,
        experience: body.experience,
        availability: body.availability,
        references: body.references,
        metadata: body.metadata || {},
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
        team: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: joinRequest,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/teams/[teamId]/join-requests error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create join request' } },
      { status: 500 }
    );
  }
}