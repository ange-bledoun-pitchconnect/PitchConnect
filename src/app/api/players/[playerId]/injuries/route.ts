// =============================================================================
// 🏥 PLAYER INJURIES API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/players/[playerId]/injuries - Get player's injury history
// POST /api/players/[playerId]/injuries - Record new injury (Medical staff)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Model: Injury
// Access: Medical-sensitive - role-based field visibility
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Sport,
  InjuryStatus,
  InjurySeverity,
  InjuryType,
  Prisma,
} from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface InjuryItem {
  id: string;
  
  // Basic info
  type: InjuryType;
  bodyPart: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  
  // Description
  title: string;
  description: string | null;
  
  // Dates
  startDate: string;
  endDate: string | null;
  estimatedReturnDate: string | null;
  actualReturnDate: string | null;
  daysOut: number;
  
  // Context
  occurredDuring: string | null; // MATCH, TRAINING, EXTERNAL
  matchId: string | null;
  trainingId: string | null;
  
  // Medical details (restricted)
  medicalDetails: {
    diagnosis: string | null;
    treatment: string | null;
    medications: string[];
    procedures: string[];
    rehabilitationPlan: string | null;
    restrictions: string[];
    notes: string | null;
  } | null;
  
  // Staff
  reportedBy: {
    id: string;
    name: string;
  } | null;
  treatedBy: {
    id: string;
    name: string;
  } | null;
  
  // Follow-up
  followUpDate: string | null;
  clearanceRequired: boolean;
  hasClearance: boolean;
  
  createdAt: string;
  updatedAt: string;
}

interface InjuriesResponse {
  player: {
    id: string;
    name: string;
    currentStatus: string;
  };
  
  injuries: InjuryItem[];
  
  activeInjuries: InjuryItem[];
  
  summary: {
    totalInjuries: number;
    activeInjuries: number;
    totalDaysOut: number;
    averageRecoveryDays: number;
    injuriesByType: Record<string, number>;
    injuriesBySeverity: Record<string, number>;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Roles that can view full medical details
const MEDICAL_VIEW_ROLES = [
  'SUPERADMIN',
  'ADMIN',
  'MEDICAL_STAFF',
  'PHYSIOTHERAPIST',
  'TEAM_DOCTOR',
];

// Roles that can create/edit injuries
const MEDICAL_MANAGE_ROLES = [
  'SUPERADMIN',
  'ADMIN',
  'MEDICAL_STAFF',
  'PHYSIOTHERAPIST',
  'TEAM_DOCTOR',
  'HEAD_COACH', // Can report, but limited fields
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetInjuriesSchema = z.object({
  status: z.nativeEnum(InjuryStatus).optional(),
  severity: z.nativeEnum(InjurySeverity).optional(),
  includeRecovered: z.coerce.boolean().default(true),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const CreateInjurySchema = z.object({
  // Required
  type: z.nativeEnum(InjuryType),
  bodyPart: z.string().min(1).max(100),
  severity: z.nativeEnum(InjurySeverity),
  title: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  
  // Optional
  description: z.string().max(2000).optional(),
  estimatedReturnDate: z.string().datetime().optional(),
  
  // Context
  occurredDuring: z.enum(['MATCH', 'TRAINING', 'EXTERNAL', 'UNKNOWN']).optional(),
  matchId: z.string().cuid().optional(),
  trainingId: z.string().cuid().optional(),
  
  // Medical (restricted to medical staff)
  diagnosis: z.string().max(1000).optional(),
  treatment: z.string().max(2000).optional(),
  medications: z.array(z.string()).default([]),
  procedures: z.array(z.string()).default([]),
  rehabilitationPlan: z.string().max(2000).optional(),
  restrictions: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
  
  // Follow-up
  followUpDate: z.string().datetime().optional(),
  clearanceRequired: z.boolean().default(false),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `injury_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

/**
 * Check user access to player injuries
 */
async function checkInjuryAccess(
  userId: string,
  playerId: string,
  action: 'view' | 'manage'
): Promise<{
  allowed: boolean;
  canViewMedical: boolean;
  canManage: boolean;
  isSelf: boolean;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      roles: true,
      player: { select: { id: true } },
      clubMembers: {
        where: { isActive: true },
        select: { clubId: true, role: true },
      },
    },
  });

  if (!user) {
    return { allowed: false, canViewMedical: false, canManage: false, isSelf: false, reason: 'User not found' };
  }

  const isSelf = user.player?.id === playerId;

  // Super admin has full access
  if (user.isSuperAdmin) {
    return { allowed: true, canViewMedical: true, canManage: true, isSelf };
  }

  // Get player's clubs
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      teamPlayers: {
        where: { isActive: true },
        select: { team: { select: { clubId: true } } },
      },
    },
  });

  const playerClubIds = player?.teamPlayers.map(tp => tp.team.clubId) || [];

  // Check role-based access
  const hasGlobalMedicalRole = user.roles.some(r => MEDICAL_VIEW_ROLES.includes(r));
  const hasGlobalManageRole = user.roles.some(r => MEDICAL_MANAGE_ROLES.includes(r));

  // Check club membership
  const relevantMembership = user.clubMembers.find(m => playerClubIds.includes(m.clubId));
  const clubRole = relevantMembership?.role;

  const canViewMedical = hasGlobalMedicalRole || 
    (clubRole && MEDICAL_VIEW_ROLES.includes(clubRole));
  const canManage = hasGlobalManageRole || 
    (clubRole && MEDICAL_MANAGE_ROLES.includes(clubRole));

  // Self can view own injuries (limited medical details)
  if (isSelf) {
    return { allowed: true, canViewMedical: false, canManage: false, isSelf };
  }

  // Coach can view injuries (limited details)
  if (relevantMembership) {
    if (action === 'view') {
      return { allowed: true, canViewMedical, canManage, isSelf };
    }
    if (action === 'manage' && canManage) {
      return { allowed: true, canViewMedical, canManage, isSelf };
    }
  }

  if (action === 'manage' && !canManage) {
    return { allowed: false, canViewMedical, canManage: false, isSelf, reason: 'Medical staff access required' };
  }

  return { allowed: relevantMembership !== undefined, canViewMedical, canManage, isSelf };
}

/**
 * Calculate days between dates
 */
function calculateDaysOut(startDate: Date, endDate: Date | null): number {
  const end = endDate || new Date();
  return Math.ceil((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

// =============================================================================
// ROUTE CONTEXT
// =============================================================================

interface RouteContext {
  params: Promise<{ playerId: string }>;
}

// =============================================================================
// GET HANDLER - Get Player Injuries
// =============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;
    const { playerId } = await context.params;

    // 2. Check access
    const access = await checkInjuryAccess(userId, playerId, 'view');
    if (!access.allowed) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: access.reason || 'Access denied',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetInjuriesSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const filters = validation.data;

    // 4. Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Build injury query
    const injuryWhere: Prisma.InjuryWhereInput = {
      playerId,
    };

    if (filters.status) {
      injuryWhere.status = filters.status;
    }

    if (filters.severity) {
      injuryWhere.severity = filters.severity;
    }

    if (!filters.includeRecovered) {
      injuryWhere.status = { not: InjuryStatus.RECOVERED };
    }

    // 6. Fetch injuries
    const injuries = await prisma.injury.findMany({
      where: injuryWhere,
      include: {
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        treatedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        match: {
          select: { id: true, date: true },
        },
        training: {
          select: { id: true, date: true },
        },
      },
      orderBy: { startDate: 'desc' },
      take: filters.limit,
    });

    // 7. Transform injuries
    const transformedInjuries: InjuryItem[] = injuries.map((injury) => ({
      id: injury.id,
      
      type: injury.type,
      bodyPart: injury.bodyPart,
      severity: injury.severity,
      status: injury.status,
      
      title: injury.title,
      description: injury.description,
      
      startDate: injury.startDate.toISOString(),
      endDate: injury.endDate?.toISOString() || null,
      estimatedReturnDate: injury.estimatedReturnDate?.toISOString() || null,
      actualReturnDate: injury.actualReturnDate?.toISOString() || null,
      daysOut: calculateDaysOut(injury.startDate, injury.endDate),
      
      occurredDuring: injury.occurredDuring,
      matchId: injury.matchId,
      trainingId: injury.trainingId,
      
      // Medical details - only if authorized
      medicalDetails: access.canViewMedical ? {
        diagnosis: injury.diagnosis,
        treatment: injury.treatment,
        medications: injury.medications || [],
        procedures: injury.procedures || [],
        rehabilitationPlan: injury.rehabilitationPlan,
        restrictions: injury.restrictions || [],
        notes: injury.notes,
      } : null,
      
      reportedBy: access.canViewMedical && injury.reportedBy ? {
        id: injury.reportedBy.id,
        name: `${injury.reportedBy.firstName} ${injury.reportedBy.lastName}`,
      } : null,
      treatedBy: access.canViewMedical && injury.treatedBy ? {
        id: injury.treatedBy.id,
        name: `${injury.treatedBy.firstName} ${injury.treatedBy.lastName}`,
      } : null,
      
      followUpDate: injury.followUpDate?.toISOString() || null,
      clearanceRequired: injury.clearanceRequired,
      hasClearance: injury.hasClearance,
      
      createdAt: injury.createdAt.toISOString(),
      updatedAt: injury.updatedAt.toISOString(),
    }));

    // 8. Get active injuries
    const activeInjuries = transformedInjuries.filter(
      i => i.status === InjuryStatus.ACTIVE || i.status === InjuryStatus.RECOVERING
    );

    // 9. Calculate summary statistics
    const injuriesByType = injuries.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const injuriesBySeverity = injuries.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recoveredInjuries = injuries.filter(i => i.status === InjuryStatus.RECOVERED && i.endDate);
    const totalDaysOut = injuries.reduce(
      (sum, i) => sum + calculateDaysOut(i.startDate, i.endDate),
      0
    );
    const averageRecoveryDays = recoveredInjuries.length > 0
      ? Math.round(recoveredInjuries.reduce(
          (sum, i) => sum + calculateDaysOut(i.startDate, i.endDate!),
          0
        ) / recoveredInjuries.length)
      : 0;

    // 10. Determine current status
    const currentStatus = activeInjuries.length > 0 
      ? 'INJURED' 
      : player.availabilityStatus;

    // 11. Build response
    const response: InjuriesResponse = {
      player: {
        id: player.id,
        name: `${player.user.firstName} ${player.user.lastName}`,
        currentStatus,
      },
      injuries: transformedInjuries,
      activeInjuries,
      summary: {
        totalInjuries: injuries.length,
        activeInjuries: activeInjuries.length,
        totalDaysOut,
        averageRecoveryDays,
        injuriesByType,
        injuriesBySeverity,
      },
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player injuries fetched`, {
      playerId,
      userId,
      total: injuries.length,
      active: activeInjuries.length,
      canViewMedical: access.canViewMedical,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/players/[id]/injuries error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch injuries',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Record Injury
// =============================================================================

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;
    const { playerId } = await context.params;

    // 2. Check access
    const access = await checkInjuryAccess(userId, playerId, 'manage');
    if (!access.allowed || !access.canManage) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: access.reason || 'Medical staff access required',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = CreateInjurySchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 4. Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Create injury record
    const injury = await prisma.injury.create({
      data: {
        playerId,
        type: data.type,
        bodyPart: data.bodyPart,
        severity: data.severity,
        status: InjuryStatus.ACTIVE,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        estimatedReturnDate: data.estimatedReturnDate ? new Date(data.estimatedReturnDate) : null,
        occurredDuring: data.occurredDuring,
        matchId: data.matchId,
        trainingId: data.trainingId,
        
        // Medical details (only if user has medical role)
        ...(access.canViewMedical && {
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          medications: data.medications,
          procedures: data.procedures,
          rehabilitationPlan: data.rehabilitationPlan,
          restrictions: data.restrictions,
          notes: data.notes,
        }),
        
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        clearanceRequired: data.clearanceRequired,
        
        reportedById: userId,
      },
    });

    // 6. Update player availability status
    await prisma.player.update({
      where: { id: playerId },
      data: { availabilityStatus: 'INJURED' },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'INJURY_RECORDED',
        resourceType: 'INJURY',
        resourceId: injury.id,
        afterState: {
          playerId,
          type: data.type,
          severity: data.severity,
          reportedBy: userId,
        },
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Injury recorded`, {
      injuryId: injury.id,
      playerId,
      type: data.type,
      severity: data.severity,
      userId,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse({
      id: injury.id,
      playerId,
      playerName: `${player.user.firstName} ${player.user.lastName}`,
      type: injury.type,
      severity: injury.severity,
      status: injury.status,
      startDate: injury.startDate.toISOString(),
      estimatedReturnDate: injury.estimatedReturnDate?.toISOString() || null,
      createdAt: injury.createdAt.toISOString(),
    }, {
      success: true,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/players/[id]/injuries error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to record injury',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';