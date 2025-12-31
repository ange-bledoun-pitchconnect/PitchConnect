// =============================================================================
// 👨‍💼 TEAM STAFF API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade coach and staff management for teams
// Multi-sport support | CoachAssignment model | Schema-aligned
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, CoachAssignmentRole, Sport } from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RouteParams {
  params: { teamId: string };
}

interface StaffMember {
  id: string;
  assignmentId: string;
  role: CoachAssignmentRole;
  isPrimary: boolean;
  startDate: string;
  endDate: string | null;
  responsibilities: string[];
  notes: string | null;
  isActive: boolean;
  coach: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar: string | null;
    email: string;
    phone: string | null;
    licenseLevel: string | null;
    specializations: string[];
    experience: number | null;
    qualifications: string[];
    rating: number | null;
    hourlyRate: number | null;
    currency: string;
    certifications: {
      id: string;
      name: string;
      issuedBy: string;
      expiryDate: string | null;
      isValid: boolean;
    }[];
  };
}

interface StaffListResponse {
  success: true;
  data: {
    staff: StaffMember[];
    summary: {
      total: number;
      byRole: Record<string, number>;
      primaryCoach: StaffMember | null;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  team: {
    id: string;
    name: string;
    sport: Sport;
    clubName: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface AddStaffResponse {
  success: true;
  data: StaffMember;
  message: string;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ListStaffSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  role: z.nativeEnum(CoachAssignmentRole).optional(),
  includeInactive: z.coerce.boolean().default(false),
  sortBy: z.enum(['role', 'startDate', 'lastName']).default('role'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const AddStaffSchema = z.object({
  coachId: z.string().min(1, 'Coach ID is required'),
  role: z.nativeEnum(CoachAssignmentRole),
  isPrimary: z.boolean().default(false),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  responsibilities: z.array(z.string().max(200)).max(20).default([]),
  notes: z.string().max(1000).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
      meta: { timestamp: new Date().toISOString(), requestId },
    },
    { status, headers: { 'X-Request-ID': requestId } }
  );
}

async function canManageStaff(userId: string, clubId: string): Promise<boolean> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER'] },
    },
  });
  return !!membership;
}

function getRoleDisplayName(role: CoachAssignmentRole): string {
  const roleNames: Record<CoachAssignmentRole, string> = {
    HEAD_COACH: 'Head Coach',
    ASSISTANT_COACH: 'Assistant Coach',
    GOALKEEPING_COACH: 'Goalkeeping Coach',
    FITNESS_COACH: 'Fitness Coach',
    YOUTH_COACH: 'Youth Coach',
    TECHNICAL_DIRECTOR: 'Technical Director',
    ANALYST: 'Performance Analyst',
    SCOUT: 'Scout',
    PHYSIO: 'Physiotherapist',
    DOCTOR: 'Team Doctor',
    NUTRITIONIST: 'Nutritionist',
    PSYCHOLOGIST: 'Sports Psychologist',
    EQUIPMENT_MANAGER: 'Equipment Manager',
    TEAM_MANAGER: 'Team Manager',
    OTHER: 'Staff Member',
  };
  return roleNames[role] || role;
}

function getRolePriority(role: CoachAssignmentRole): number {
  const priorities: Record<CoachAssignmentRole, number> = {
    HEAD_COACH: 1,
    TECHNICAL_DIRECTOR: 2,
    ASSISTANT_COACH: 3,
    GOALKEEPING_COACH: 4,
    FITNESS_COACH: 5,
    YOUTH_COACH: 6,
    ANALYST: 7,
    SCOUT: 8,
    PHYSIO: 9,
    DOCTOR: 10,
    NUTRITIONIST: 11,
    PSYCHOLOGIST: 12,
    TEAM_MANAGER: 13,
    EQUIPMENT_MANAGER: 14,
    OTHER: 15,
  };
  return priorities[role] || 99;
}

// =============================================================================
// GET /api/teams/[teamId]/staff
// List all staff members assigned to a team
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<StaffListResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { teamId } = params;

    // 2. Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sport: true,
        clubId: true,
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!team) {
      return createErrorResponse('TEAM_NOT_FOUND', 'Team not found', requestId, 404);
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      role: searchParams.get('role') || undefined,
      includeInactive: searchParams.get('includeInactive') || 'false',
      sortBy: searchParams.get('sortBy') || 'role',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    };

    const validatedParams = ListStaffSchema.parse(queryParams);
    const { page, limit, role, includeInactive, sortBy, sortOrder } = validatedParams;
    const skip = (page - 1) * limit;

    // 4. Build where clause
    const where: Prisma.CoachAssignmentWhereInput = { teamId };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (role) {
      where.role = role;
    }

    // 5. Get total count
    const total = await prisma.coachAssignment.count({ where });

    // 6. Fetch staff assignments
    const assignments = await prisma.coachAssignment.findMany({
      where,
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
                email: true,
                phoneNumber: true,
              },
            },
            certifications: {
              where: {
                OR: [
                  { expiryDate: null },
                  { expiryDate: { gte: new Date() } },
                ],
              },
              select: {
                id: true,
                name: true,
                issuedBy: true,
                expiryDate: true,
                isVerified: true,
              },
              take: 5,
            },
          },
        },
      },
    });

    // 7. Sort by role priority if sortBy is 'role'
    let sortedAssignments = assignments;
    if (sortBy === 'role') {
      sortedAssignments = [...assignments].sort((a, b) => {
        const priorityA = getRolePriority(a.role);
        const priorityB = getRolePriority(b.role);
        return sortOrder === 'asc' ? priorityA - priorityB : priorityB - priorityA;
      });
    } else if (sortBy === 'lastName') {
      sortedAssignments = [...assignments].sort((a, b) => {
        const nameA = a.coach.user.lastName.toLowerCase();
        const nameB = b.coach.user.lastName.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (sortBy === 'startDate') {
      sortedAssignments = [...assignments].sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    // 8. Format staff data
    const formattedStaff: StaffMember[] = sortedAssignments.map((assignment) => ({
      id: assignment.coach.id,
      assignmentId: assignment.id,
      role: assignment.role,
      isPrimary: assignment.isPrimary,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString() || null,
      responsibilities: assignment.responsibilities,
      notes: assignment.notes,
      isActive: assignment.isActive,
      coach: {
        id: assignment.coach.id,
        userId: assignment.coach.userId,
        firstName: assignment.coach.user.firstName,
        lastName: assignment.coach.user.lastName,
        fullName: `${assignment.coach.user.firstName} ${assignment.coach.user.lastName}`,
        avatar: assignment.coach.user.avatar,
        email: assignment.coach.user.email,
        phone: assignment.coach.user.phoneNumber,
        licenseLevel: assignment.coach.licenseLevel,
        specializations: assignment.coach.specialization,
        experience: assignment.coach.experience,
        qualifications: assignment.coach.qualifications,
        rating: assignment.coach.rating,
        hourlyRate: assignment.coach.hourlyRate,
        currency: assignment.coach.currency,
        certifications: assignment.coach.certifications.map((cert) => ({
          id: cert.id,
          name: cert.name,
          issuedBy: cert.issuedBy,
          expiryDate: cert.expiryDate?.toISOString() || null,
          isValid: cert.isVerified && (!cert.expiryDate || cert.expiryDate >= new Date()),
        })),
      },
    }));

    // 9. Calculate summary
    const byRole: Record<string, number> = {};
    formattedStaff.forEach((staff) => {
      const roleName = getRoleDisplayName(staff.role);
      byRole[roleName] = (byRole[roleName] || 0) + 1;
    });

    const primaryCoach = formattedStaff.find((s) => s.isPrimary && s.role === 'HEAD_COACH') || null;

    // 10. Build response
    const totalPages = Math.ceil(total / limit);

    const response: StaffListResponse = {
      success: true,
      data: {
        staff: formattedStaff,
        summary: {
          total: formattedStaff.length,
          byRole,
          primaryCoach,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        clubName: team.club.name,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/teams/[teamId]/staff error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch staff', requestId, 500);
  }
}

// =============================================================================
// POST /api/teams/[teamId]/staff
// Assign a coach/staff member to a team
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AddStaffResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { teamId } = params;

    // 2. Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        sport: true,
        clubId: true,
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!team) {
      return createErrorResponse('TEAM_NOT_FOUND', 'Team not found or inactive', requestId, 404);
    }

    // 3. Authorization - only managers and owners can assign staff
    const hasPermission = await canManageStaff(session.user.id, team.clubId);
    if (!hasPermission) {
      return createErrorResponse(
        'FORBIDDEN',
        'You do not have permission to manage team staff. Only club owners and managers can assign staff.',
        requestId,
        403
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = AddStaffSchema.parse(body);

    // 5. Verify coach exists
    const coach = await prisma.coach.findUnique({
      where: { id: validatedData.coachId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phoneNumber: true,
          },
        },
        certifications: {
          where: {
            OR: [
              { expiryDate: null },
              { expiryDate: { gte: new Date() } },
            ],
          },
          select: {
            id: true,
            name: true,
            issuedBy: true,
            expiryDate: true,
            isVerified: true,
          },
          take: 5,
        },
      },
    });

    if (!coach) {
      return createErrorResponse('COACH_NOT_FOUND', 'Coach not found', requestId, 404);
    }

    // 6. Check if coach is already assigned to this team in the same role
    const existingAssignment = await prisma.coachAssignment.findFirst({
      where: {
        teamId,
        coachId: validatedData.coachId,
        role: validatedData.role,
        isActive: true,
      },
    });

    if (existingAssignment) {
      return createErrorResponse(
        'ALREADY_ASSIGNED',
        `${coach.user.firstName} ${coach.user.lastName} is already assigned as ${getRoleDisplayName(validatedData.role)} for this team`,
        requestId,
        409
      );
    }

    // 7. Handle primary coach assignment
    if (validatedData.isPrimary && validatedData.role === 'HEAD_COACH') {
      // Remove primary flag from existing primary head coach
      await prisma.coachAssignment.updateMany({
        where: {
          teamId,
          role: 'HEAD_COACH',
          isPrimary: true,
          isActive: true,
        },
        data: { isPrimary: false },
      });
    }

    // 8. Create assignment
    const assignment = await prisma.coachAssignment.create({
      data: {
        teamId,
        coachId: validatedData.coachId,
        clubId: team.clubId,
        role: validatedData.role,
        isPrimary: validatedData.isPrimary,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : new Date(),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        responsibilities: validatedData.responsibilities,
        notes: validatedData.notes || null,
        isActive: true,
      },
      include: {
        coach: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
                phoneNumber: true,
              },
            },
            certifications: {
              where: {
                OR: [
                  { expiryDate: null },
                  { expiryDate: { gte: new Date() } },
                ],
              },
              select: {
                id: true,
                name: true,
                issuedBy: true,
                expiryDate: true,
                isVerified: true,
              },
              take: 5,
            },
          },
        },
      },
    });

    // 9. Create notification for coach
    await prisma.notification.create({
      data: {
        userId: coach.user.id,
        type: 'TEAM_ASSIGNMENT',
        title: 'Team Assignment',
        message: `You have been assigned as ${getRoleDisplayName(validatedData.role)} for ${team.name}`,
        data: {
          teamId: team.id,
          teamName: team.name,
          role: validatedData.role,
          assignmentId: assignment.id,
        },
        link: `/teams/${team.id}`,
      },
    });

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'STAFF_ASSIGNED_TO_TEAM',
        resourceType: 'CoachAssignment',
        resourceId: assignment.id,
        details: {
          teamId: team.id,
          teamName: team.name,
          coachId: coach.id,
          coachName: `${coach.user.firstName} ${coach.user.lastName}`,
          role: validatedData.role,
          isPrimary: validatedData.isPrimary,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 11. Format response
    const formattedStaff: StaffMember = {
      id: assignment.coach.id,
      assignmentId: assignment.id,
      role: assignment.role,
      isPrimary: assignment.isPrimary,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString() || null,
      responsibilities: assignment.responsibilities,
      notes: assignment.notes,
      isActive: assignment.isActive,
      coach: {
        id: assignment.coach.id,
        userId: assignment.coach.userId,
        firstName: assignment.coach.user.firstName,
        lastName: assignment.coach.user.lastName,
        fullName: `${assignment.coach.user.firstName} ${assignment.coach.user.lastName}`,
        avatar: assignment.coach.user.avatar,
        email: assignment.coach.user.email,
        phone: assignment.coach.user.phoneNumber,
        licenseLevel: assignment.coach.licenseLevel,
        specializations: assignment.coach.specialization,
        experience: assignment.coach.experience,
        qualifications: assignment.coach.qualifications,
        rating: assignment.coach.rating,
        hourlyRate: assignment.coach.hourlyRate,
        currency: assignment.coach.currency,
        certifications: assignment.coach.certifications.map((cert) => ({
          id: cert.id,
          name: cert.name,
          issuedBy: cert.issuedBy,
          expiryDate: cert.expiryDate?.toISOString() || null,
          isValid: cert.isVerified && (!cert.expiryDate || cert.expiryDate >= new Date()),
        })),
      },
    };

    const response: AddStaffResponse = {
      success: true,
      data: formattedStaff,
      message: `${coach.user.firstName} ${coach.user.lastName} has been assigned as ${getRoleDisplayName(validatedData.role)} for ${team.name}`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 201,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/teams/[teamId]/staff error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to assign staff', requestId, 500);
  }
}
