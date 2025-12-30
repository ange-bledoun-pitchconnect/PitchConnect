// =============================================================================
// 👨‍🏫 INDIVIDUAL COACH API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]
// PATCH  /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]
// DELETE /api/manager/clubs/[clubId]/teams/[teamId]/coaches/[coachId]
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ Generic
// Permission: Club Owner, Manager
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, TeamRole } from '@prisma/client';

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
    coachId: string;
  };
}

interface CoachDetail {
  id: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  role: TeamRole;
  clubRole: ClubMemberRole;
  specialization?: string | null;
  certifications: string[];
  bio?: string | null;
  joinedAt: string;
  isActive: boolean;
  
  // Training sessions
  trainingSessions: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    type: string;
    attendeeCount: number;
  }>;
  
  // Timesheet summary
  timesheets: {
    thisMonth: number;
    lastMonth: number;
    total: number;
    entries: Array<{
      id: string;
      date: string;
      hoursWorked: number;
      description?: string;
    }>;
  };
  
  // Permissions
  canEdit: boolean;
  canRemove: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateCoachSchema = z.object({
  role: z.enum(['HEAD_COACH', 'ASSISTANT_COACH', 'GOALKEEPER_COACH', 'FITNESS_COACH']).optional(),
  specialization: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `coach_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const MANAGE_ROLES = [ClubMemberRole.OWNER, ClubMemberRole.MANAGER];

async function getPermissions(
  userId: string,
  clubId: string
): Promise<{ canView: boolean; canEdit: boolean; canRemove: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  
  if (user?.isSuperAdmin) {
    return { canView: true, canEdit: true, canRemove: true };
  }

  const clubMember = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
    },
    select: { role: true },
  });

  if (!clubMember) {
    return { canView: false, canEdit: false, canRemove: false };
  }

  const hasManageRole = MANAGE_ROLES.includes(clubMember.role);

  return {
    canView: true, // Any club member can view
    canEdit: hasManageRole,
    canRemove: hasManageRole,
  };
}

// =============================================================================
// GET HANDLER - Fetch Coach Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, coachId } = params;

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

    // 2. Get permissions
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canView) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view this coach',
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

    // 4. Fetch team member (coach)
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: coachId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
            bio: true,
          },
        },
      },
    });

    if (!teamMember || teamMember.teamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Coach not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Get club member info
    const clubMember = await prisma.clubMember.findFirst({
      where: {
        userId: teamMember.userId,
        clubId,
      },
      select: {
        role: true,
        specialization: true,
        certifications: true,
      },
    });

    // 6. Get training sessions
    const now = new Date();
    const trainingSessions = await prisma.trainingSession.findMany({
      where: {
        teamId,
        coachId: teamMember.userId,
        startTime: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      include: {
        _count: { select: { attendees: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    // 7. Get timesheet data
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const timesheetEntries = await prisma.coachTimesheet.findMany({
      where: {
        coachId: teamMember.userId,
        teamId,
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const timesheetStats = {
      thisMonth: 0,
      lastMonth: 0,
      total: 0,
    };

    for (const entry of timesheetEntries) {
      timesheetStats.total += entry.hoursWorked;
      if (entry.date >= startOfMonth) {
        timesheetStats.thisMonth += entry.hoursWorked;
      } else if (entry.date >= startOfLastMonth && entry.date <= endOfLastMonth) {
        timesheetStats.lastMonth += entry.hoursWorked;
      }
    }

    // 8. Build response
    const response: CoachDetail = {
      id: teamMember.id,
      userId: teamMember.userId,
      name: `${teamMember.user.firstName} ${teamMember.user.lastName}`,
      firstName: teamMember.user.firstName,
      lastName: teamMember.user.lastName,
      email: teamMember.user.email,
      avatar: teamMember.user.avatar,
      phone: teamMember.user.phone,
      role: teamMember.role,
      clubRole: clubMember?.role || ClubMemberRole.ASSISTANT_COACH,
      specialization: clubMember?.specialization || null,
      certifications: clubMember?.certifications || [],
      bio: teamMember.user.bio,
      joinedAt: teamMember.createdAt.toISOString(),
      isActive: teamMember.isActive,
      trainingSessions: trainingSessions.map((ts) => ({
        id: ts.id,
        title: ts.title,
        startTime: ts.startTime.toISOString(),
        endTime: ts.endTime.toISOString(),
        type: ts.type,
        attendeeCount: ts._count.attendees,
      })),
      timesheets: {
        ...timesheetStats,
        entries: timesheetEntries.slice(0, 10).map((e) => ({
          id: e.id,
          date: e.date.toISOString(),
          hoursWorked: e.hoursWorked,
          description: e.description || undefined,
        })),
      },
      canEdit: permissions.canEdit,
      canRemove: permissions.canRemove,
    };

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Coach error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch coach details',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update Coach
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, coachId } = params;

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
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to edit coaches',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: coachId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!teamMember || teamMember.teamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Coach not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
        requestId,
        status: 400,
      });
    }

    const validation = UpdateCoachSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { role, specialization, isActive } = validation.data;

    // 6. Check HEAD_COACH limit if promoting
    if (role === 'HEAD_COACH' && teamMember.role !== 'HEAD_COACH') {
      const existingHead = await prisma.teamMember.findFirst({
        where: {
          teamId,
          role: 'HEAD_COACH',
          isActive: true,
          id: { not: coachId },
        },
      });

      if (existingHead) {
        return createResponse(null, {
          success: false,
          error: 'Team already has a head coach',
          code: 'HEAD_COACH_EXISTS',
          requestId,
          status: 400,
        });
      }
    }

    // 7. Update team member
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.teamMember.update({
      where: { id: coachId },
      data: updateData,
    });

    // 8. Update club member specialization if provided
    if (specialization !== undefined) {
      await prisma.clubMember.updateMany({
        where: {
          userId: teamMember.userId,
          clubId,
        },
        data: { specialization },
      });
    }

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'TEAM_MEMBER',
        entityId: coachId,
        description: `Updated coach ${teamMember.user.firstName} ${teamMember.user.lastName} in team ${team.name}`,
        metadata: {
          changes: Object.keys(validation.data),
          teamId,
          clubId,
        },
      },
    });

    return createResponse({
      id: updated.id,
      role: updated.role,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    }, {
      success: true,
      message: 'Coach updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Coach error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update coach',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Remove Coach from Team
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, coachId } = params;

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
    const permissions = await getPermissions(session.user.id, clubId);
    if (!permissions.canRemove) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to remove coaches',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
    });

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Fetch team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: coachId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!teamMember || teamMember.teamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Coach not found in this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 5. Check for upcoming training sessions
    const upcomingSessions = await prisma.trainingSession.count({
      where: {
        teamId,
        coachId: teamMember.userId,
        startTime: { gt: new Date() },
      },
    });

    // Parse query param to force delete
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (upcomingSessions > 0 && !force) {
      return createResponse(null, {
        success: false,
        error: `Coach has ${upcomingSessions} upcoming training sessions. Use force=true to remove anyway, or reassign sessions first.`,
        code: 'HAS_UPCOMING_SESSIONS',
        requestId,
        status: 400,
      });
    }

    // 6. Soft delete (mark as inactive) or hard delete based on history
    const hasTimesheets = await prisma.coachTimesheet.count({
      where: {
        coachId: teamMember.userId,
        teamId,
      },
    });

    if (hasTimesheets > 0) {
      // Soft delete - preserve history
      await prisma.teamMember.update({
        where: { id: coachId },
        data: { isActive: false },
      });
    } else {
      // Hard delete - no history to preserve
      await prisma.teamMember.delete({
        where: { id: coachId },
      });
    }

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'TEAM_MEMBER',
        entityId: coachId,
        description: `Removed coach ${teamMember.user.firstName} ${teamMember.user.lastName} from team ${team.name}`,
        metadata: {
          coachUserId: teamMember.userId,
          teamId,
          clubId,
          softDelete: hasTimesheets > 0,
        },
      },
    });

    return createResponse(null, {
      success: true,
      message: 'Coach removed from team successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Remove Coach error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to remove coach',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
