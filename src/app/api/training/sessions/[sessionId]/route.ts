// ============================================================================
// 🏋️ TRAINING SESSION BY ID - API ROUTES
// ============================================================================
// GET, PUT, DELETE endpoints for individual training sessions
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { UpdateTrainingSessionSchema } from '@/schemas/training.schema';

interface RouteParams {
  params: { sessionId: string };
}

// ============================================================================
// GET /api/training/[sessionId] - Get single training session
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            sport: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            ageGroup: true,
            gender: true,
          },
        },
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
        attendance: {
          include: {
            player: {
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
          },
          orderBy: {
            player: {
              user: { lastName: 'asc' },
            },
          },
        },
        media: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            url: true,
            thumbnailUrl: true,
            duration: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!trainingSession) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } },
        { status: 404 }
      );
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: trainingSession.clubId,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not a member of this club' } },
        { status: 403 }
      );
    }

    // Calculate attendance summary
    const attendanceSummary = {
      total: trainingSession.attendance.length,
      present: trainingSession.attendance.filter(a =>
        ['PRESENT', 'LATE', 'LEFT_EARLY', 'PARTIAL'].includes(a.status)
      ).length,
      absent: trainingSession.attendance.filter(a => a.status === 'ABSENT').length,
      excused: trainingSession.attendance.filter(a => a.status === 'EXCUSED').length,
      injured: trainingSession.attendance.filter(a => a.status === 'INJURED').length,
      sick: trainingSession.attendance.filter(a => a.status === 'SICK').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...trainingSession,
        attendanceSummary,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('GET /api/training/[sessionId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch training session' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/training/[sessionId] - Update training session
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { sessionId } = params;
    const body = await request.json();

    // Validate input
    const parseResult = UpdateTrainingSessionSchema.safeParse(body);
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

    // Get existing session
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: {
        id: true,
        clubId: true,
        coachId: true,
        startTime: true,
        endTime: true,
        facilityId: true,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } },
        { status: 404 }
      );
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: existingSession.clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No permission to update this session' } },
        { status: 403 }
      );
    }

    // Check for facility conflicts if time or facility is changing
    const newStartTime = input.startTime || existingSession.startTime;
    const newEndTime = input.endTime || existingSession.endTime;
    const newFacilityId = input.facilityId !== undefined ? input.facilityId : existingSession.facilityId;

    if (newFacilityId) {
      const facilityConflict = await prisma.trainingSession.findFirst({
        where: {
          id: { not: sessionId },
          facilityId: newFacilityId,
          deletedAt: null,
          status: { notIn: ['CANCELLED', 'POSTPONED'] },
          AND: [
            { startTime: { lt: newEndTime } },
            { endTime: { gt: newStartTime } },
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

    // Build update data
    const updateData: Prisma.TrainingSessionUpdateInput = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.startTime !== undefined) updateData.startTime = input.startTime;
    if (input.endTime !== undefined) updateData.endTime = input.endTime;
    if (input.intensity !== undefined) updateData.intensity = input.intensity;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.customCategory !== undefined) updateData.customCategory = input.customCategory;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.facilityId !== undefined) updateData.facilityId = input.facilityId;
    if (input.maxParticipants !== undefined) updateData.maxParticipants = input.maxParticipants;
    if (input.drills !== undefined) updateData.drills = input.drills as Prisma.JsonValue;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.equipment !== undefined) updateData.equipment = input.equipment;
    if (input.focusAreas !== undefined) updateData.focusAreas = input.focusAreas;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.teamId !== undefined) updateData.teamId = input.teamId;

    // Update session
    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: updateData,
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
        attendance: {
          include: {
            player: {
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSession,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('PUT /api/training/[sessionId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update training session' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/training/[sessionId] - Delete training session (soft delete)
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    // Get existing session
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: { id: true, clubId: true, name: true },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } },
        { status: 404 }
      );
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: existingSession.clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No permission to delete this session' } },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.trainingSession.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true, sessionId, name: existingSession.name },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('DELETE /api/training/[sessionId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete training session' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/training/[sessionId] - Partial update (e.g., status change)
// ============================================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { sessionId } = params;
    const body = await request.json();

    // Get existing session
    const existingSession = await prisma.trainingSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      select: { id: true, clubId: true },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Training session not found' } },
        { status: 404 }
      );
    }

    // Check permission
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubId: existingSession.clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No permission to update this session' } },
        { status: 403 }
      );
    }

    // Handle specific PATCH operations
    const { action, ...data } = body;

    let updateData: Prisma.TrainingSessionUpdateInput = {};

    switch (action) {
      case 'cancel':
        updateData = {
          status: 'CANCELLED',
          notes: data.reason ? `CANCELLED: ${data.reason}` : undefined,
        };
        break;

      case 'complete':
        updateData = {
          status: 'COMPLETED',
        };
        break;

      case 'start':
        updateData = {
          status: 'IN_PROGRESS',
        };
        break;

      case 'postpone':
        updateData = {
          status: 'POSTPONED',
          notes: data.reason ? `POSTPONED: ${data.reason}` : undefined,
        };
        break;

      default:
        // Generic partial update
        updateData = data;
    }

    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: updateData,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSession,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('PATCH /api/training/[sessionId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update training session' } },
      { status: 500 }
    );
  }
}