// =============================================================================
// 🏥 CLEAR INJURY API - Enterprise-Grade Implementation
// =============================================================================
// PATCH /api/manager/clubs/[clubId]/teams/[teamId]/injuries/[injuryId]/clear
// Mark injury as recovered / update injury status
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ Generic
// Permission: Club Owner, Manager, Head Coach, Medical Staff
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, InjuryStatus } from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
    injuryId: string;
  };
}

interface ClearedInjuryResponse {
  id: string;
  player: {
    id: string;
    name: string;
  };
  type: string;
  severity: string;
  status: InjuryStatus;
  dateOccurred: string;
  returnDate: string;
  recoveryDays: number;
  matchesMissed: number;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ClearInjurySchema = z.object({
  returnDate: z.string().datetime().optional(), // Defaults to now
  clearanceNotes: z.string().max(2000).optional(),
  clearedForFullTraining: z.boolean().default(true),
  clearedForMatchPlay: z.boolean().default(true),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().datetime().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.nativeEnum(InjuryStatus),
  notes: z.string().max(2000).optional(),
  expectedReturn: z.string().datetime().optional(),
  treatment: z.string().max(2000).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `injury_clear_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: string;
    code?: string;
    message?: string;
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    requestId: options.requestId,
    timestamp: new Date().toISOString(),
  };

  if (options.success && data !== null) response.data = data;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;
  if (options.message) response.message = options.message;

  return NextResponse.json(response, { status: options.status || 200 });
}

const ALLOWED_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.PHYSIO,
  ClubMemberRole.MEDICAL_STAFF,
];

async function hasPermission(userId: string, clubId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (user?.isSuperAdmin) return true;

  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ALLOWED_ROLES },
    },
  });

  return !!clubMember;
}

// =============================================================================
// PATCH HANDLER - Clear Injury (Mark as Recovered)
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, injuryId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Authorization
    const permitted = await hasPermission(session.user.id, clubId);
    if (!permitted) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to update injury records',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found or does not belong to this club',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch injury
    const injury = await prisma.injury.findUnique({
      where: { id: injuryId },
      include: {
        player: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!injury) {
      return createResponse(null, {
        success: false,
        error: 'Injury record not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Verify player is in team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: injury.player.userId,
      },
    });

    if (!teamMember) {
      return createResponse(null, {
        success: false,
        error: 'Player not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Check if already recovered
    if (injury.status === 'RECOVERED') {
      return createResponse(null, {
        success: false,
        error: 'Injury is already marked as recovered',
        code: 'ALREADY_RECOVERED',
        requestId,
        status: 400,
      });
    }

    // 7. Parse body - determine if this is clear or status update
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is okay for simple clear
    }

    // Check if this is a status update or a clear operation
    const isStatusUpdate = body.status && body.status !== 'RECOVERED';

    let updatedInjury;
    let recoveryDays = 0;

    if (isStatusUpdate) {
      // 8a. Validate status update
      const validation = UpdateStatusSchema.safeParse(body);
      if (!validation.success) {
        return createResponse(null, {
          success: false,
          error: validation.error.errors[0]?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
          requestId,
          status: 400,
        });
      }

      const { status, notes, expectedReturn, treatment } = validation.data;

      // Update injury status
      updatedInjury = await prisma.injury.update({
        where: { id: injuryId },
        data: {
          status,
          statusNotes: notes || null,
          expectedReturn: expectedReturn ? new Date(expectedReturn) : undefined,
          treatment: treatment || undefined,
        },
        include: {
          player: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

    } else {
      // 8b. Validate clear/recovery
      const validation = ClearInjurySchema.safeParse(body);
      if (!validation.success) {
        return createResponse(null, {
          success: false,
          error: validation.error.errors[0]?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
          requestId,
          status: 400,
        });
      }

      const { 
        returnDate, 
        clearanceNotes, 
        clearedForFullTraining,
        clearedForMatchPlay,
        followUpRequired,
        followUpDate 
      } = validation.data;

      const actualReturnDate = returnDate ? new Date(returnDate) : new Date();

      // Calculate recovery days
      recoveryDays = Math.ceil(
        (actualReturnDate.getTime() - injury.dateOccurred.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Update injury to recovered
      updatedInjury = await prisma.injury.update({
        where: { id: injuryId },
        data: {
          status: 'RECOVERED',
          returnDate: actualReturnDate,
          clearanceNotes: clearanceNotes || null,
          clearedForFullTraining,
          clearedForMatchPlay,
          followUpRequired,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          clearedById: session.user.id,
        },
        include: {
          player: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    }

    // 9. Count matches missed
    const matchesMissed = await prisma.match.count({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'COMPLETED',
        kickOffTime: {
          gte: injury.dateOccurred,
          ...(updatedInjury.returnDate ? { lte: updatedInjury.returnDate } : {}),
        },
      },
    });

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'INJURY',
        entityId: injuryId,
        description: isStatusUpdate
          ? `Updated injury status for ${updatedInjury.player.user.firstName} ${updatedInjury.player.user.lastName} to ${updatedInjury.status}`
          : `Cleared injury for ${updatedInjury.player.user.firstName} ${updatedInjury.player.user.lastName} - ${injury.type}`,
        metadata: {
          playerId: injury.playerId,
          teamId,
          clubId,
          previousStatus: injury.status,
          newStatus: updatedInjury.status,
          recoveryDays: isStatusUpdate ? null : recoveryDays,
        },
      },
    });

    // 11. Create notification for player (if recovered)
    if (updatedInjury.status === 'RECOVERED') {
      await prisma.notification.create({
        data: {
          userId: injury.player.userId,
          type: 'INJURY_UPDATE',
          title: 'Injury Cleared',
          message: `You have been cleared from your ${injury.type} injury. ${
            updatedInjury.clearedForMatchPlay ? 'You are cleared for match play.' : 'Check with medical staff for match clearance.'
          }`,
          link: `/player/injuries/${injuryId}`,
          data: { injuryId, teamId },
        },
      });
    }

    // 12. Transform response
    const response: ClearedInjuryResponse = {
      id: updatedInjury.id,
      player: {
        id: updatedInjury.player.id,
        name: `${updatedInjury.player.user.firstName} ${updatedInjury.player.user.lastName}`,
      },
      type: updatedInjury.type,
      severity: updatedInjury.severity,
      status: updatedInjury.status,
      dateOccurred: updatedInjury.dateOccurred.toISOString(),
      returnDate: updatedInjury.returnDate?.toISOString() || new Date().toISOString(),
      recoveryDays,
      matchesMissed,
    };

    return createResponse(response, {
      success: true,
      message: isStatusUpdate
        ? `Injury status updated to ${updatedInjury.status}`
        : 'Injury cleared successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Clear Injury error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update injury record',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Remove Injury Record (Admin only)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, injuryId } = params;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        requestId,
        status: 401,
      });
    }

    // 2. Authorization - only owners/managers can delete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    let hasDeletePermission = user?.isSuperAdmin || false;

    if (!hasDeletePermission) {
      const clubMember = await prisma.clubMember.findFirst({
        where: {
          userId: session.user.id,
          clubId,
          isActive: true,
          role: { in: [ClubMemberRole.OWNER, ClubMemberRole.MANAGER] },
        },
      });
      hasDeletePermission = !!clubMember;
    }

    if (!hasDeletePermission) {
      return createResponse(null, {
        success: false,
        error: 'Only club owners or managers can delete injury records',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found or does not belong to this club',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch injury
    const injury = await prisma.injury.findUnique({
      where: { id: injuryId },
      include: {
        player: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!injury) {
      return createResponse(null, {
        success: false,
        error: 'Injury record not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Verify player is in team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: injury.player.userId,
      },
    });

    if (!teamMember) {
      return createResponse(null, {
        success: false,
        error: 'Player not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Delete injury
    await prisma.injury.delete({
      where: { id: injuryId },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'INJURY',
        entityId: injuryId,
        description: `Deleted injury record for ${injury.player.user.firstName} ${injury.player.user.lastName}: ${injury.type}`,
        metadata: {
          playerId: injury.playerId,
          teamId,
          clubId,
          injuryType: injury.type,
          severity: injury.severity,
        },
      },
    });

    return createResponse(null, {
      success: true,
      message: 'Injury record deleted successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Delete Injury error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete injury record',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
