// ============================================================================
// 🏋️ TRAINING API ROUTES - PitchConnect v7.3.0
// ============================================================================
// RESTful API endpoints for training session management
// Supports Hybrid Architecture: Club-wide OR Team-specific training
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  CreateTrainingSessionSchema,
  TrainingSessionFiltersSchema,
  PaginationSchema,
  TrainingStatusSchema,
  TrainingCategorySchema,
  TrainingIntensitySchema,
  parseEnumArray,
} from '@/schemas/training.schema';

// ============================================================================
// GET /api/training - List training sessions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const clubId = searchParams.get('clubId');
    if (!clubId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'clubId is required' } },
        { status: 400 }
      );
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not a member of this club' } },
        { status: 403 }
      );
    }

    // Parse filters
    const teamId = searchParams.get('teamId');
    const coachId = searchParams.get('coachId');
    const statusParam = searchParams.get('status');
    const categoryParam = searchParams.get('category');
    const intensityParam = searchParams.get('intensity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const facilityId = searchParams.get('facilityId');

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'startTime';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TrainingSessionWhereInput = {
      clubId,
      deletedAt: null,
    };

    if (teamId !== null && teamId !== undefined) {
      where.teamId = teamId === 'null' ? null : teamId;
    }

    if (coachId) {
      where.coachId = coachId;
    }

    if (statusParam) {
      const statuses = parseEnumArray(statusParam, TrainingStatusSchema);
      if (statuses && statuses.length > 0) {
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    if (categoryParam) {
      const categories = parseEnumArray(categoryParam, TrainingCategorySchema);
      if (categories && categories.length > 0) {
        where.category = categories.length === 1 ? categories[0] : { in: categories };
      }
    }

    if (intensityParam) {
      const intensities = parseEnumArray(intensityParam, TrainingIntensitySchema);
      if (intensities && intensities.length > 0) {
        where.intensity = intensities.length === 1 ? intensities[0] : { in: intensities };
      }
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.trainingSession.count({ where });

    // Get sessions
    const sessions = await prisma.trainingSession.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { attendance: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        data: sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + sessions.length < total,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('GET /api/training error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch training sessions' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/training - Create training session
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const parseResult = CreateTrainingSessionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: input.clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No permission to create training sessions' } },
        { status: 403 }
      );
    }

    // Check for facility conflicts
    if (input.facilityId) {
      const facilityConflict = await prisma.trainingSession.findFirst({
        where: {
          facilityId: input.facilityId,
          deletedAt: null,
          status: { notIn: ['CANCELLED', 'POSTPONED'] },
          AND: [
            { startTime: { lt: input.endTime } },
            { endTime: { gt: input.startTime } },
          ],
        },
        select: { id: true, name: true },
      });

      if (facilityConflict) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: `Facility already booked for: ${facilityConflict.name}`,
              details: { conflictingSessionId: facilityConflict.id },
            },
          },
          { status: 409 }
        );
      }
    }

    // Create training session
    const trainingSession = await prisma.trainingSession.create({
      data: {
        clubId: input.clubId,
        teamId: input.teamId,
        coachId: input.coachId,
        name: input.name,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        intensity: input.intensity,
        category: input.category,
        customCategory: input.customCategory,
        location: input.location,
        facilityId: input.facilityId,
        maxParticipants: input.maxParticipants,
        drills: input.drills as Prisma.JsonValue,
        notes: input.notes,
        equipment: input.equipment,
        focusAreas: input.focusAreas,
        status: input.status,
      },
      include: {
        club: true,
        team: true,
        coach: {
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
        attendance: true,
      },
    });

    // Auto-add team players if team-specific
    if (input.teamId) {
      const teamPlayers = await prisma.teamPlayer.findMany({
        where: { teamId: input.teamId, isActive: true },
        select: { playerId: true },
      });

      if (teamPlayers.length > 0) {
        await prisma.trainingAttendance.createMany({
          data: teamPlayers.map(tp => ({
            sessionId: trainingSession.id,
            playerId: tp.playerId,
            status: 'PRESENT',
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: trainingSession,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/training error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create training session' } },
      { status: 500 }
    );
  }
}