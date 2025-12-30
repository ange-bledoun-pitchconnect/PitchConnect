// =============================================================================
// 👨‍🏫 TEAM COACHES API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/manager/clubs/[clubId]/teams/[teamId]/coaches - List coaches
// POST /api/manager/clubs/[clubId]/teams/[teamId]/coaches - Add coach to team
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
  requestId: string;
  timestamp: string;
}

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
  };
}

interface CoachRecord {
  id: string; // TeamMember ID
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: TeamRole;
  clubRole: ClubMemberRole;
  phone?: string | null;
  specialization?: string | null;
  certifications: string[];
  joinedAt: string;
  isActive: boolean;
  
  // Statistics
  trainingSessions: number;
  upcomingSessions: number;
  
  // Timesheet summary
  hoursThisMonth: number;
  totalHours: number;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AddCoachSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['HEAD_COACH', 'ASSISTANT_COACH', 'GOALKEEPER_COACH', 'FITNESS_COACH']).default('ASSISTANT_COACH'),
  specialization: z.string().max(200).optional(),
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

  return NextResponse.json(response, { status: options.status || 200 });
}

const MANAGE_ROLES = [ClubMemberRole.OWNER, ClubMemberRole.MANAGER];

const COACH_CLUB_ROLES = [
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.GOALKEEPER_COACH,
  ClubMemberRole.FITNESS_COACH,
];

const COACH_TEAM_ROLES: TeamRole[] = [
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'GOALKEEPER_COACH',
  'FITNESS_COACH',
];

async function hasManagePermission(userId: string, clubId: string): Promise<boolean> {
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
      role: { in: MANAGE_ROLES },
    },
  });

  return !!clubMember;
}

// =============================================================================
// GET HANDLER - List Coaches
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId } = params;

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

    // 2. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, clubId: true },
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

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // 4. Fetch team members with coach roles
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        role: { in: COACH_TEAM_ROLES },
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // HEAD_COACH first
        { createdAt: 'asc' },
      ],
    });

    // 5. Get club member info for each coach
    const userIds = teamMembers.map((tm) => tm.userId);
    const clubMembers = await prisma.clubMember.findMany({
      where: {
        clubId,
        userId: { in: userIds },
      },
      select: {
        userId: true,
        role: true,
        certifications: true,
        specialization: true,
      },
    });
    const clubMemberMap = new Map(clubMembers.map((cm) => [cm.userId, cm]));

    // 6. Get training session counts
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const trainingSessions = await prisma.trainingSession.groupBy({
      by: ['coachId'],
      where: {
        teamId,
        coachId: { in: userIds },
      },
      _count: { id: true },
    });
    const sessionCountMap = new Map(trainingSessions.map((ts) => [ts.coachId, ts._count.id]));

    const upcomingSessions = await prisma.trainingSession.groupBy({
      by: ['coachId'],
      where: {
        teamId,
        coachId: { in: userIds },
        startTime: { gte: now },
      },
      _count: { id: true },
    });
    const upcomingMap = new Map(upcomingSessions.map((ts) => [ts.coachId, ts._count.id]));

    // 7. Get timesheet data
    const timesheets = await prisma.coachTimesheet.findMany({
      where: {
        coachId: { in: userIds },
        teamId,
      },
      select: {
        coachId: true,
        hoursWorked: true,
        date: true,
      },
    });

    const timesheetMap = new Map<string, { thisMonth: number; total: number }>();
    for (const ts of timesheets) {
      const current = timesheetMap.get(ts.coachId) || { thisMonth: 0, total: 0 };
      current.total += ts.hoursWorked;
      if (ts.date >= startOfMonth) {
        current.thisMonth += ts.hoursWorked;
      }
      timesheetMap.set(ts.coachId, current);
    }

    // 8. Build response
    const coaches: CoachRecord[] = teamMembers.map((tm) => {
      const clubMember = clubMemberMap.get(tm.userId);
      const timesheet = timesheetMap.get(tm.userId) || { thisMonth: 0, total: 0 };

      return {
        id: tm.id,
        userId: tm.userId,
        name: `${tm.user.firstName} ${tm.user.lastName}`,
        email: tm.user.email,
        avatar: tm.user.avatar,
        role: tm.role,
        clubRole: clubMember?.role || ClubMemberRole.ASSISTANT_COACH,
        phone: tm.user.phone,
        specialization: clubMember?.specialization || null,
        certifications: clubMember?.certifications || [],
        joinedAt: tm.createdAt.toISOString(),
        isActive: tm.isActive,
        trainingSessions: sessionCountMap.get(tm.userId) || 0,
        upcomingSessions: upcomingMap.get(tm.userId) || 0,
        hoursThisMonth: timesheet.thisMonth,
        totalHours: timesheet.total,
      };
    });

    return createResponse({
      team: { id: team.id, name: team.name },
      coaches,
      totalCoaches: coaches.length,
      activeCoaches: coaches.filter((c) => c.isActive).length,
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] List Coaches error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch coaches',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Add Coach to Team
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId } = params;

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
    const hasPermission = await hasManagePermission(session.user.id, clubId);
    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to manage coaches',
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
        error: 'Team not found or does not belong to this club',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Parse and validate body
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

    const validation = AddCoachSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { userId, role, specialization } = validation.data;

    // 5. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      return createResponse(null, {
        success: false,
        error: 'User not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Verify user is a club member with coach role
    const clubMember = await prisma.clubMember.findFirst({
      where: {
        userId,
        clubId,
        isActive: true,
        role: { in: COACH_CLUB_ROLES },
      },
    });

    if (!clubMember) {
      return createResponse(null, {
        success: false,
        error: 'User must be a coach in this club to be added to team',
        code: 'NOT_COACH',
        requestId,
        status: 400,
      });
    }

    // 7. Check if already in team
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (existingMember) {
      // Reactivate if inactive
      if (!existingMember.isActive) {
        const reactivated = await prisma.teamMember.update({
          where: { id: existingMember.id },
          data: {
            isActive: true,
            role: role as TeamRole,
          },
        });

        return createResponse({
          id: reactivated.id,
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: reactivated.role,
          reactivated: true,
        }, {
          success: true,
          requestId,
        });
      }

      return createResponse(null, {
        success: false,
        error: 'Coach is already a member of this team',
        code: 'ALREADY_MEMBER',
        requestId,
        status: 400,
      });
    }

    // 8. Check HEAD_COACH limit (only one per team)
    if (role === 'HEAD_COACH') {
      const existingHead = await prisma.teamMember.findFirst({
        where: {
          teamId,
          role: 'HEAD_COACH',
          isActive: true,
        },
      });

      if (existingHead) {
        return createResponse(null, {
          success: false,
          error: 'Team already has a head coach. Remove or demote existing head coach first.',
          code: 'HEAD_COACH_EXISTS',
          requestId,
          status: 400,
        });
      }
    }

    // 9. Create team membership
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: role as TeamRole,
        isActive: true,
      },
    });

    // 10. Update club member specialization if provided
    if (specialization) {
      await prisma.clubMember.update({
        where: { id: clubMember.id },
        data: { specialization },
      });
    }

    // 11. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'TEAM_MEMBER',
        entityId: teamMember.id,
        description: `Added coach ${user.firstName} ${user.lastName} to team ${team.name} as ${role}`,
        metadata: {
          coachUserId: userId,
          teamId,
          clubId,
          role,
        },
      },
    });

    // 12. Return response
    return createResponse({
      id: teamMember.id,
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
      role: teamMember.role,
      clubRole: clubMember.role,
      joinedAt: teamMember.createdAt.toISOString(),
      isActive: true,
    }, {
      success: true,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Add Coach error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to add coach to team',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
