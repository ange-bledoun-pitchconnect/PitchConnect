// =============================================================================
// 👥 BULK PLAYERS API - Enterprise-Grade Implementation
// =============================================================================
// POST /api/manager/clubs/[clubId]/teams/[teamId]/players/bulk
// Add multiple players to team in a single operation
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ Generic
// Permission: Club Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole } from '@prisma/client';

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
  };
}

interface BulkAddResult {
  totalRequested: number;
  successful: number;
  failed: number;
  reactivated: number;
  results: Array<{
    userId: string;
    name: string;
    status: 'ADDED' | 'REACTIVATED' | 'ALREADY_EXISTS' | 'NOT_FOUND' | 'NOT_PLAYER' | 'SHIRT_TAKEN' | 'ERROR';
    teamMemberId?: string;
    playerId?: string;
    error?: string;
  }>;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const BulkPlayerSchema = z.object({
  userId: z.string().min(1),
  position: z.string().max(50).optional(),
  shirtNumber: z.number().int().min(1).max(99).optional(),
});

const BulkAddPlayersSchema = z.object({
  players: z.array(BulkPlayerSchema).min(1).max(50), // Max 50 at once
  skipExisting: z.boolean().default(true),
  reactivateInactive: z.boolean().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const MANAGE_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
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
// POST HANDLER - Bulk Add Players
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
        error: 'You do not have permission to manage players',
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

    const validation = BulkAddPlayersSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: validation.error.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        status: 400,
      });
    }

    const { players, skipExisting, reactivateInactive } = validation.data;

    // 5. Gather all user IDs and fetch users
    const userIds = players.map((p) => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 6. Check which users are club members with PLAYER role
    const clubMembers = await prisma.clubMember.findMany({
      where: {
        userId: { in: userIds },
        clubId,
        isActive: true,
        role: ClubMemberRole.PLAYER,
      },
      select: { userId: true },
    });
    const playerUserIds = new Set(clubMembers.map((cm) => cm.userId));

    // 7. Get existing team members
    const existingMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        userId: { in: userIds },
      },
      select: {
        id: true,
        userId: true,
        isActive: true,
      },
    });
    const existingMemberMap = new Map(existingMembers.map((m) => [m.userId, m]));

    // 8. Get taken shirt numbers
    const takenShirts = await prisma.player.findMany({
      where: {
        shirtNumber: { in: players.map((p) => p.shirtNumber).filter((n): n is number => n !== undefined) },
        user: {
          teamMembers: {
            some: {
              teamId,
              isActive: true,
            },
          },
        },
      },
      select: { shirtNumber: true, userId: true },
    });
    const takenShirtMap = new Map(takenShirts.map((t) => [t.shirtNumber, t.userId]));

    // 9. Process each player
    const results: BulkAddResult['results'] = [];
    let successful = 0;
    let failed = 0;
    let reactivated = 0;

    for (const playerData of players) {
      const user = userMap.get(playerData.userId);
      
      // User not found
      if (!user) {
        results.push({
          userId: playerData.userId,
          name: 'Unknown',
          status: 'NOT_FOUND',
          error: 'User not found',
        });
        failed++;
        continue;
      }

      const name = `${user.firstName} ${user.lastName}`;

      // Not a player in club
      if (!playerUserIds.has(playerData.userId)) {
        results.push({
          userId: playerData.userId,
          name,
          status: 'NOT_PLAYER',
          error: 'User is not a player in this club',
        });
        failed++;
        continue;
      }

      // Check existing membership
      const existingMember = existingMemberMap.get(playerData.userId);
      if (existingMember) {
        if (existingMember.isActive) {
          if (skipExisting) {
            results.push({
              userId: playerData.userId,
              name,
              status: 'ALREADY_EXISTS',
              teamMemberId: existingMember.id,
            });
            continue; // Don't count as failed
          } else {
            results.push({
              userId: playerData.userId,
              name,
              status: 'ALREADY_EXISTS',
              error: 'Player already in team',
            });
            failed++;
            continue;
          }
        } else if (reactivateInactive) {
          // Reactivate
          await prisma.teamMember.update({
            where: { id: existingMember.id },
            data: { isActive: true },
          });
          results.push({
            userId: playerData.userId,
            name,
            status: 'REACTIVATED',
            teamMemberId: existingMember.id,
          });
          reactivated++;
          successful++;
          continue;
        }
      }

      // Check shirt number availability
      if (playerData.shirtNumber) {
        const takenBy = takenShirtMap.get(playerData.shirtNumber);
        if (takenBy && takenBy !== playerData.userId) {
          results.push({
            userId: playerData.userId,
            name,
            status: 'SHIRT_TAKEN',
            error: `Shirt number ${playerData.shirtNumber} is already taken`,
          });
          failed++;
          continue;
        }
      }

      // Create player profile if needed
      try {
        let player = await prisma.player.findUnique({
          where: { userId: playerData.userId },
        });

        if (!player) {
          player = await prisma.player.create({
            data: {
              userId: playerData.userId,
              position: playerData.position || null,
              shirtNumber: playerData.shirtNumber || null,
            },
          });
        } else if (playerData.position || playerData.shirtNumber) {
          player = await prisma.player.update({
            where: { id: player.id },
            data: {
              ...(playerData.position ? { position: playerData.position } : {}),
              ...(playerData.shirtNumber ? { shirtNumber: playerData.shirtNumber } : {}),
            },
          });
        }

        // Create team membership
        const teamMember = await prisma.teamMember.create({
          data: {
            teamId,
            userId: playerData.userId,
            role: 'PLAYER',
            isActive: true,
          },
        });

        results.push({
          userId: playerData.userId,
          name,
          status: 'ADDED',
          teamMemberId: teamMember.id,
          playerId: player.id,
        });
        successful++;

        // Mark shirt number as taken for subsequent players
        if (playerData.shirtNumber) {
          takenShirtMap.set(playerData.shirtNumber, playerData.userId);
        }
      } catch (error) {
        console.error(`Error adding player ${playerData.userId}:`, error);
        results.push({
          userId: playerData.userId,
          name,
          status: 'ERROR',
          error: 'Failed to add player',
        });
        failed++;
      }
    }

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BULK_CREATE',
        entityType: 'TEAM_MEMBER',
        entityId: teamId,
        description: `Bulk added ${successful} players to team ${team.name}`,
        metadata: {
          teamId,
          clubId,
          totalRequested: players.length,
          successful,
          failed,
          reactivated,
        },
      },
    });

    // 11. Build response
    const response: BulkAddResult = {
      totalRequested: players.length,
      successful,
      failed,
      reactivated,
      results,
    };

    return createResponse(response, {
      success: true,
      message: `Successfully added ${successful} players to team`,
      requestId,
      status: successful > 0 ? 201 : 200,
    });
  } catch (error) {
    console.error(`[${requestId}] Bulk Add Players error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to bulk add players',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
