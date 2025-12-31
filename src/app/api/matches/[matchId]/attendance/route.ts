// =============================================================================
// 👥 MATCH ATTENDANCE API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/matches/[matchId]/attendance - Get player attendance
// POST /api/matches/[matchId]/attendance - Update attendance (single/bulk)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club members (view), Player (self), Coach/Manager (all)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, MatchAttendanceStatus } from '@prisma/client';

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
    matchId: string;
  };
}

interface AttendanceRecord {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
    avatar: string | null;
    shirtNumber: number | null;
    position: string | null;
  };
  teamId: string;
  teamName: string;
  teamSide: 'home' | 'away';
  status: MatchAttendanceStatus;
  respondedAt: string | null;
  notes: string | null;
  reason: string | null;
}

interface AttendanceSummary {
  home: {
    available: number;
    unavailable: number;
    pending: number;
    maybe: number;
    total: number;
  };
  away: {
    available: number;
    unavailable: number;
    pending: number;
    maybe: number;
    total: number;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SingleAttendanceSchema = z.object({
  playerId: z.string().optional(), // Optional - if not provided, uses current user
  status: z.nativeEnum(MatchAttendanceStatus),
  notes: z.string().max(500).optional(),
  reason: z.string().max(200).optional(), // Reason for unavailability
});

const BulkAttendanceSchema = z.object({
  attendance: z.array(z.object({
    playerId: z.string(),
    status: z.nativeEnum(MatchAttendanceStatus),
    notes: z.string().max(500).optional(),
    reason: z.string().max(200).optional(),
  })),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `attend_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const MANAGE_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
];

// =============================================================================
// GET HANDLER - Get Attendance Records
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId } = params;

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

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const teamSide = searchParams.get('teamSide') as 'home' | 'away' | null;
    const status = searchParams.get('status') as MatchAttendanceStatus | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // 3. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        attendanceDeadline: true,
        kickOffTime: true,
      },
    });

    if (!match) {
      return createResponse(null, {
        success: false,
        error: 'Match not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Build where clause
    const where: Record<string, unknown> = { matchId };

    if (teamSide) {
      where.player = {
        teamPlayers: {
          some: {
            teamId: teamSide === 'home' ? match.homeTeamId : match.awayTeamId,
            isActive: true,
          },
        },
      };
    }

    if (status) {
      where.status = status;
    }

    // 5. Fetch attendance records
    const [attendance, total] = await Promise.all([
      prisma.matchAttendance.findMany({
        where,
        include: {
          player: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatar: true },
              },
              teamPlayers: {
                where: {
                  teamId: { in: [match.homeTeamId, match.awayTeamId] },
                  isActive: true,
                },
                select: {
                  teamId: true,
                  position: true,
                  shirtNumber: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' },
          { player: { user: { lastName: 'asc' } } },
        ],
      }),
      prisma.matchAttendance.count({ where }),
    ]);

    // 6. Transform and categorize attendance
    const records: AttendanceRecord[] = attendance.map((a) => {
      const teamPlayer = a.player.teamPlayers[0];
      const isHome = teamPlayer?.teamId === match.homeTeamId;

      return {
        id: a.id,
        playerId: a.playerId,
        player: {
          id: a.player.id,
          name: `${a.player.user.firstName} ${a.player.user.lastName}`,
          avatar: a.player.user.avatar,
          shirtNumber: teamPlayer?.shirtNumber || a.player.shirtNumber,
          position: teamPlayer?.position || a.player.primaryPosition,
        },
        teamId: teamPlayer?.teamId || '',
        teamName: isHome ? match.homeTeam.name : match.awayTeam.name,
        teamSide: isHome ? 'home' : 'away',
        status: a.status,
        respondedAt: a.respondedAt?.toISOString() || null,
        notes: a.notes,
        reason: a.reason,
      };
    });

    // 7. Calculate summary
    const summary: AttendanceSummary = {
      home: { available: 0, unavailable: 0, pending: 0, maybe: 0, total: 0 },
      away: { available: 0, unavailable: 0, pending: 0, maybe: 0, total: 0 },
    };

    records.forEach((r) => {
      const side = r.teamSide;
      summary[side].total++;

      switch (r.status) {
        case MatchAttendanceStatus.AVAILABLE:
        case MatchAttendanceStatus.CONFIRMED:
          summary[side].available++;
          break;
        case MatchAttendanceStatus.UNAVAILABLE:
        case MatchAttendanceStatus.INJURED:
        case MatchAttendanceStatus.SUSPENDED:
          summary[side].unavailable++;
          break;
        case MatchAttendanceStatus.MAYBE:
        case MatchAttendanceStatus.TENTATIVE:
          summary[side].maybe++;
          break;
        default:
          summary[side].pending++;
      }
    });

    // 8. Check if deadline passed
    const now = new Date();
    const deadlinePassed = match.attendanceDeadline
      ? now > match.attendanceDeadline
      : now > match.kickOffTime;

    return createResponse({
      attendance: records,
      summary,
      matchInfo: {
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        kickOffTime: match.kickOffTime.toISOString(),
        attendanceDeadline: match.attendanceDeadline?.toISOString() || null,
        deadlinePassed,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Attendance error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch attendance',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Update Attendance
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { matchId } = params;

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

    // 2. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        homeClubId: true,
        awayClubId: true,
        homeTeamId: true,
        awayTeamId: true,
        attendanceDeadline: true,
        kickOffTime: true,
        status: true,
      },
    });

    if (!match) {
      return createResponse(null, {
        success: false,
        error: 'Match not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 3. Parse body
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

    // 4. Determine if bulk or single update
    const isBulk = Array.isArray(body.attendance);

    if (isBulk) {
      // BULK UPDATE - requires manager permission
      const membership = await prisma.clubMember.findFirst({
        where: {
          userId: session.user.id,
          clubId: { in: [match.homeClubId, match.awayClubId] },
          isActive: true,
          role: { in: MANAGE_ROLES },
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isSuperAdmin: true },
      });

      if (!membership && !user?.isSuperAdmin) {
        return createResponse(null, {
          success: false,
          error: 'You do not have permission to bulk update attendance',
          code: 'FORBIDDEN',
          requestId,
          status: 403,
        });
      }

      // Validate bulk data
      const validation = BulkAttendanceSchema.safeParse(body);
      if (!validation.success) {
        return createResponse(null, {
          success: false,
          error: validation.error.errors[0]?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
          requestId,
          status: 400,
        });
      }

      // Perform bulk upsert
      const results = await Promise.all(
        validation.data.attendance.map((item) =>
          prisma.matchAttendance.upsert({
            where: {
              matchId_playerId: {
                matchId,
                playerId: item.playerId,
              },
            },
            update: {
              status: item.status,
              notes: item.notes,
              reason: item.reason,
              respondedAt: new Date(),
            },
            create: {
              matchId,
              playerId: item.playerId,
              status: item.status,
              notes: item.notes,
              reason: item.reason,
              respondedAt: new Date(),
            },
          })
        )
      );

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ATTENDANCE_BULK_UPDATED',
          resourceType: 'MATCH',
          resourceId: matchId,
          afterState: {
            count: results.length,
            updatedBy: 'MANAGER',
          },
        },
      });

      return createResponse({
        updated: results.length,
        attendance: results.map((r) => ({
          playerId: r.playerId,
          status: r.status,
        })),
      }, {
        success: true,
        message: `Updated ${results.length} attendance records`,
        requestId,
      });
    } else {
      // SINGLE UPDATE - player can update own, manager can update any
      const validation = SingleAttendanceSchema.safeParse(body);
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

      // Get player ID - either from body or current user's player profile
      let playerId = data.playerId;

      if (!playerId) {
        // Look up current user's player profile
        const player = await prisma.player.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        });

        if (!player) {
          return createResponse(null, {
            success: false,
            error: 'Player profile not found. Provide playerId or create a player profile.',
            code: 'PLAYER_NOT_FOUND',
            requestId,
            status: 400,
          });
        }

        playerId = player.id;
      } else {
        // Updating another player's attendance - check permission
        const player = await prisma.player.findUnique({
          where: { id: playerId },
          select: { userId: true },
        });

        if (!player) {
          return createResponse(null, {
            success: false,
            error: 'Player not found',
            code: 'PLAYER_NOT_FOUND',
            requestId,
            status: 404,
          });
        }

        // If not updating self, must be manager
        if (player.userId !== session.user.id) {
          const membership = await prisma.clubMember.findFirst({
            where: {
              userId: session.user.id,
              clubId: { in: [match.homeClubId, match.awayClubId] },
              isActive: true,
              role: { in: MANAGE_ROLES },
            },
          });

          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isSuperAdmin: true },
          });

          if (!membership && !user?.isSuperAdmin) {
            return createResponse(null, {
              success: false,
              error: 'You can only update your own attendance',
              code: 'FORBIDDEN',
              requestId,
              status: 403,
            });
          }
        }
      }

      // Check deadline
      const now = new Date();
      const deadline = match.attendanceDeadline || match.kickOffTime;
      if (now > deadline) {
        // Check if user is manager (can override deadline)
        const membership = await prisma.clubMember.findFirst({
          where: {
            userId: session.user.id,
            clubId: { in: [match.homeClubId, match.awayClubId] },
            isActive: true,
            role: { in: MANAGE_ROLES },
          },
        });

        if (!membership) {
          return createResponse(null, {
            success: false,
            error: 'Attendance deadline has passed',
            code: 'DEADLINE_PASSED',
            requestId,
            status: 400,
          });
        }
      }

      // Upsert attendance
      const attendance = await prisma.matchAttendance.upsert({
        where: {
          matchId_playerId: {
            matchId,
            playerId,
          },
        },
        update: {
          status: data.status,
          notes: data.notes,
          reason: data.reason,
          respondedAt: new Date(),
        },
        create: {
          matchId,
          playerId,
          status: data.status,
          notes: data.notes,
          reason: data.reason,
          respondedAt: new Date(),
        },
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

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ATTENDANCE_UPDATED',
          resourceType: 'MATCH_ATTENDANCE',
          resourceId: attendance.id,
          afterState: {
            playerId,
            status: data.status,
          },
        },
      });

      return createResponse({
        id: attendance.id,
        playerId: attendance.playerId,
        playerName: `${attendance.player.user.firstName} ${attendance.player.user.lastName}`,
        status: attendance.status,
        respondedAt: attendance.respondedAt?.toISOString(),
      }, {
        success: true,
        message: 'Attendance updated successfully',
        requestId,
      });
    }
  } catch (error) {
    console.error(`[${requestId}] Update Attendance error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update attendance',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}