// =============================================================================
// 🏥 TEAM INJURIES API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/manager/clubs/[clubId]/teams/[teamId]/injuries - List injuries
// POST /api/manager/clubs/[clubId]/teams/[teamId]/injuries - Create injury
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Head Coach, Medical Staff
// Scoping: Team (default), Club, or Individual player
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, InjuryStatus, InjurySeverity, Sport } from '@prisma/client';

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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
  };
}

interface InjuryRecord {
  id: string;
  player: {
    id: string;
    userId: string;
    name: string;
    position: string | null;
    shirtNumber: number | null;
    photo?: string | null;
  };
  type: string;
  bodyPart: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  dateOccurred: string;
  expectedReturn: string | null;
  actualReturn: string | null;
  description: string | null;
  treatment: string | null;
  matchesExpectedToMiss: number | null;
  matchesMissed: number;
  isLongTerm: boolean;
  reportedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface InjurySummary {
  totalActive: number;
  totalRecovered: number;
  bySeverity: Record<InjurySeverity, number>;
  byBodyPart: Record<string, number>;
  avgRecoveryDays: number;
}

// =============================================================================
// SPORT-SPECIFIC INJURY CONFIGURATIONS
// =============================================================================

// Common injury types per sport
const SPORT_COMMON_INJURIES: Record<Sport, string[]> = {
  FOOTBALL: ['Hamstring Strain', 'ACL Tear', 'Ankle Sprain', 'Groin Pull', 'Knee Injury', 'Calf Strain', 'Achilles Injury', 'Concussion'],
  FUTSAL: ['Ankle Sprain', 'Knee Injury', 'Groin Pull', 'Hamstring Strain', 'Foot Injury'],
  BEACH_FOOTBALL: ['Ankle Sprain', 'Foot Injury', 'Shoulder Injury', 'Knee Injury'],
  RUGBY: ['Concussion', 'Shoulder Dislocation', 'ACL Tear', 'Hamstring Strain', 'Neck Injury', 'Broken Bone'],
  CRICKET: ['Hamstring Strain', 'Back Injury', 'Shoulder Injury', 'Ankle Sprain', 'Side Strain'],
  AMERICAN_FOOTBALL: ['Concussion', 'ACL Tear', 'Shoulder Injury', 'Ankle Sprain', 'Knee Injury', 'Hamstring Strain'],
  BASKETBALL: ['Ankle Sprain', 'ACL Tear', 'Knee Injury', 'Finger Injury', 'Achilles Injury'],
  HOCKEY: ['Hamstring Strain', 'Ankle Sprain', 'Knee Injury', 'Back Injury', 'Hip Injury'],
  LACROSSE: ['Concussion', 'Shoulder Injury', 'Ankle Sprain', 'ACL Tear', 'Knee Injury'],
  NETBALL: ['Ankle Sprain', 'ACL Tear', 'Knee Injury', 'Finger Injury'],
  AUSTRALIAN_RULES: ['Hamstring Strain', 'ACL Tear', 'Concussion', 'Groin Pull', 'Shoulder Injury'],
  GAELIC_FOOTBALL: ['Hamstring Strain', 'ACL Tear', 'Ankle Sprain', 'Groin Pull', 'Shoulder Injury'],
};

const BODY_PARTS = [
  'Head', 'Neck', 'Shoulder', 'Arm', 'Elbow', 'Wrist', 'Hand', 'Finger',
  'Back', 'Chest', 'Abdomen', 'Hip', 'Groin', 'Thigh', 'Hamstring', 'Quadriceps',
  'Knee', 'Calf', 'Shin', 'Ankle', 'Foot', 'Toe', 'Other',
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CreateInjurySchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  type: z.string().min(1, 'Injury type is required').max(100),
  bodyPart: z.string().min(1, 'Body part is required').max(50),
  severity: z.nativeEnum(InjurySeverity),
  dateOccurred: z.string().datetime(),
  expectedReturn: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),
  treatment: z.string().max(2000).optional(),
  matchesExpectedToMiss: z.number().int().min(0).max(100).optional(),
  occurredDuringMatchId: z.string().optional(),
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
    error?: string;
    code?: string;
    requestId: string;
    status?: number;
    pagination?: ApiResponse<T>['pagination'];
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
  if (options.pagination) response.pagination = options.pagination;

  return NextResponse.json(response, { status: options.status || 200 });
}

const ALLOWED_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
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

function isLongTermInjury(severity: InjurySeverity, matchesExpected: number | null): boolean {
  if (severity === 'SEVERE' || severity === 'CRITICAL') return true;
  if (matchesExpected && matchesExpected > 10) return true;
  return false;
}

// =============================================================================
// GET HANDLER - List Injuries
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

    // 2. Authorization
    const permitted = await hasPermission(session.user.id, clubId);
    if (!permitted) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view injury records',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify club and team
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, sport: true },
    });

    if (!club) {
      return createResponse(null, {
        success: false,
        error: 'Club not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

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

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') as InjuryStatus | null;
    const severity = searchParams.get('severity') as InjurySeverity | null;
    const scope = searchParams.get('scope') || 'team'; // team, club, player
    const playerId = searchParams.get('playerId');
    const includeRecovered = searchParams.get('includeRecovered') === 'true';

    // 5. Get team member user IDs
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId, isActive: true },
      select: { userId: true },
    });
    const teamUserIds = teamMembers.map((tm) => tm.userId);

    // Get player IDs for these users
    const players = await prisma.player.findMany({
      where: { userId: { in: teamUserIds } },
      select: { id: true, userId: true },
    });
    const teamPlayerIds = players.map((p) => p.id);

    // 6. Build injury filter
    const where: Record<string, unknown> = {};

    // Scope filter
    if (scope === 'team') {
      where.playerId = { in: teamPlayerIds };
    } else if (scope === 'player' && playerId) {
      where.playerId = playerId;
      // Verify player is in team
      if (!teamPlayerIds.includes(playerId)) {
        return createResponse(null, {
          success: false,
          error: 'Player not found in this team',
          code: 'NOT_FOUND',
          requestId,
          status: 404,
        });
      }
    } else if (scope === 'club') {
      // For club scope, get all players in the club
      const clubTeams = await prisma.team.findMany({
        where: { clubId },
        select: { id: true },
      });
      const clubTeamIds = clubTeams.map((t) => t.id);
      
      const allClubMembers = await prisma.teamMember.findMany({
        where: { teamId: { in: clubTeamIds }, isActive: true },
        select: { userId: true },
      });
      const allClubUserIds = [...new Set(allClubMembers.map((m) => m.userId))];
      
      const allClubPlayers = await prisma.player.findMany({
        where: { userId: { in: allClubUserIds } },
        select: { id: true },
      });
      where.playerId = { in: allClubPlayers.map((p) => p.id) };
    }

    // Status filter
    if (status) {
      where.status = status;
    } else if (!includeRecovered) {
      where.status = { in: ['ACTIVE', 'RECOVERING', 'MONITORING'] };
    }

    // Severity filter
    if (severity) {
      where.severity = severity;
    }

    // 7. Get total count
    const total = await prisma.injury.count({ where });

    // 8. Fetch injuries
    const skip = (page - 1) * limit;
    const injuries = await prisma.injury.findMany({
      where,
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
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Active first
        { severity: 'desc' }, // Most severe first
        { dateOccurred: 'desc' },
      ],
      skip,
      take: limit,
    });

    // 9. Count matches missed for each injury
    // For each active injury, count completed matches since injury date
    const injuryRecords: InjuryRecord[] = await Promise.all(
      injuries.map(async (injury) => {
        let matchesMissed = 0;
        
        if (injury.status !== 'RECOVERED') {
          // Count team matches since injury occurred
          matchesMissed = await prisma.match.count({
            where: {
              OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
              status: 'COMPLETED',
              kickOffTime: { gte: injury.dateOccurred },
            },
          });
        }

        return {
          id: injury.id,
          player: {
            id: injury.player.id,
            userId: injury.player.userId,
            name: `${injury.player.user.firstName} ${injury.player.user.lastName}`,
            position: injury.player.position,
            shirtNumber: injury.player.shirtNumber,
            photo: injury.player.user.avatar,
          },
          type: injury.type,
          bodyPart: injury.bodyPart,
          severity: injury.severity,
          status: injury.status,
          dateOccurred: injury.dateOccurred.toISOString(),
          expectedReturn: injury.expectedReturn?.toISOString() || null,
          actualReturn: injury.returnDate?.toISOString() || null,
          description: injury.description,
          treatment: injury.treatment,
          matchesExpectedToMiss: injury.matchesExpectedToMiss,
          matchesMissed,
          isLongTerm: isLongTermInjury(injury.severity, injury.matchesExpectedToMiss),
          reportedBy: injury.reportedBy ? {
            id: injury.reportedBy.id,
            name: `${injury.reportedBy.firstName} ${injury.reportedBy.lastName}`,
          } : undefined,
          createdAt: injury.createdAt.toISOString(),
          updatedAt: injury.updatedAt.toISOString(),
        };
      })
    );

    // 10. Build summary
    const allInjuries = await prisma.injury.findMany({
      where: { playerId: { in: teamPlayerIds } },
      select: { severity: true, status: true, bodyPart: true, dateOccurred: true, returnDate: true },
    });

    const summary: InjurySummary = {
      totalActive: allInjuries.filter((i) => i.status !== 'RECOVERED').length,
      totalRecovered: allInjuries.filter((i) => i.status === 'RECOVERED').length,
      bySeverity: {
        MINOR: allInjuries.filter((i) => i.severity === 'MINOR').length,
        MODERATE: allInjuries.filter((i) => i.severity === 'MODERATE').length,
        SEVERE: allInjuries.filter((i) => i.severity === 'SEVERE').length,
        CRITICAL: allInjuries.filter((i) => i.severity === 'CRITICAL').length,
      },
      byBodyPart: {},
      avgRecoveryDays: 0,
    };

    // Body part counts
    for (const injury of allInjuries) {
      summary.byBodyPart[injury.bodyPart] = (summary.byBodyPart[injury.bodyPart] || 0) + 1;
    }

    // Average recovery time
    const recoveredInjuries = allInjuries.filter((i) => i.status === 'RECOVERED' && i.returnDate);
    if (recoveredInjuries.length > 0) {
      const totalDays = recoveredInjuries.reduce((sum, i) => {
        const days = Math.ceil(
          (i.returnDate!.getTime() - i.dateOccurred.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      summary.avgRecoveryDays = Math.round(totalDays / recoveredInjuries.length);
    }

    return createResponse({
      injuries: injuryRecords,
      summary,
      sportContext: {
        sport: club.sport,
        commonInjuries: SPORT_COMMON_INJURIES[club.sport],
        bodyParts: BODY_PARTS,
      },
    }, {
      success: true,
      requestId,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`[${requestId}] List Injuries error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch injury records',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Injury Record
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
    const permitted = await hasPermission(session.user.id, clubId);
    if (!permitted) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to create injury records',
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

    const validation = CreateInjurySchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 5. Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: data.playerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: 'Player not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Verify player is in team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: player.userId,
        isActive: true,
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

    // 7. Create injury record
    const injury = await prisma.injury.create({
      data: {
        playerId: data.playerId,
        type: data.type,
        bodyPart: data.bodyPart,
        severity: data.severity,
        status: 'ACTIVE',
        dateOccurred: new Date(data.dateOccurred),
        expectedReturn: data.expectedReturn ? new Date(data.expectedReturn) : null,
        description: data.description || null,
        treatment: data.treatment || null,
        matchesExpectedToMiss: data.matchesExpectedToMiss || null,
        reportedById: session.user.id,
        matchId: data.occurredDuringMatchId || null,
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
              },
            },
          },
        },
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'INJURY',
        entityId: injury.id,
        description: `Created injury record for ${player.user.firstName} ${player.user.lastName}: ${data.type}`,
        metadata: {
          playerId: data.playerId,
          teamId,
          clubId,
          severity: data.severity,
          bodyPart: data.bodyPart,
        },
      },
    });

    // 9. Transform response
    const response: InjuryRecord = {
      id: injury.id,
      player: {
        id: injury.player.id,
        userId: injury.player.userId,
        name: `${injury.player.user.firstName} ${injury.player.user.lastName}`,
        position: injury.player.position,
        shirtNumber: injury.player.shirtNumber,
        photo: injury.player.user.avatar,
      },
      type: injury.type,
      bodyPart: injury.bodyPart,
      severity: injury.severity,
      status: injury.status,
      dateOccurred: injury.dateOccurred.toISOString(),
      expectedReturn: injury.expectedReturn?.toISOString() || null,
      actualReturn: null,
      description: injury.description,
      treatment: injury.treatment,
      matchesExpectedToMiss: injury.matchesExpectedToMiss,
      matchesMissed: 0,
      isLongTerm: isLongTermInjury(injury.severity, injury.matchesExpectedToMiss),
      reportedBy: injury.reportedBy ? {
        id: injury.reportedBy.id,
        name: `${injury.reportedBy.firstName} ${injury.reportedBy.lastName}`,
      } : undefined,
      createdAt: injury.createdAt.toISOString(),
      updatedAt: injury.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] Create Injury error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to create injury record',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
