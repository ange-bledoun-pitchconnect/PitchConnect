// =============================================================================
// 📋 MATCH LINEUP API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/matches/[matchId]/lineup - Get match lineups
// PUT /api/matches/[matchId]/lineup - Update match lineups
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports with sport-specific formations
// Permission: Club members (view), Coach/Manager (edit)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ClubMemberRole, Sport, MatchSquadStatus } from '@prisma/client';

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

interface LineupPlayer {
  playerId: string;
  name: string;
  avatar: string | null;
  position: string | null;
  shirtNumber: number | null;
  lineupPosition: number | null;
  status: MatchSquadStatus;
  isCaptain: boolean;
  substituteOrder: number | null;
}

interface TeamLineup {
  teamId: string;
  teamName: string;
  formation: string | null;
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
  captain: string | null;
  totalPlayers: number;
}

// =============================================================================
// MULTI-SPORT FORMATION CONFIGURATION
// =============================================================================

const SPORT_FORMATIONS: Record<Sport, {
  formations: string[];
  starterCount: number;
  maxSubstitutes: number;
  positions: string[];
}> = {
  FOOTBALL: {
    formations: ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2', '4-5-1', '4-1-4-1', '3-4-1-2'],
    starterCount: 11,
    maxSubstitutes: 7,
    positions: ['GK', 'RB', 'CB', 'LB', 'RWB', 'LWB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'],
  },
  RUGBY: {
    formations: ['Standard XV'],
    starterCount: 15,
    maxSubstitutes: 8,
    positions: ['Loosehead Prop', 'Hooker', 'Tighthead Prop', 'Lock', 'Blindside Flanker', 'Openside Flanker', 'Number 8', 'Scrum-half', 'Fly-half', 'Left Wing', 'Inside Centre', 'Outside Centre', 'Right Wing', 'Fullback'],
  },
  BASKETBALL: {
    formations: ['Standard Five'],
    starterCount: 5,
    maxSubstitutes: 7,
    positions: ['PG', 'SG', 'SF', 'PF', 'C'],
  },
  CRICKET: {
    formations: ['Batting Order'],
    starterCount: 11,
    maxSubstitutes: 1,
    positions: ['Opener', 'Top Order', 'Middle Order', 'Lower Order', 'Wicketkeeper', 'All-rounder', 'Bowler'],
  },
  AMERICAN_FOOTBALL: {
    formations: ['4-3 Defense', '3-4 Defense', 'Shotgun', 'I-Formation', 'Spread'],
    starterCount: 11,
    maxSubstitutes: 46,
    positions: ['QB', 'RB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT', 'DE', 'DT', 'NT', 'OLB', 'MLB', 'ILB', 'CB', 'FS', 'SS', 'K', 'P'],
  },
  NETBALL: {
    formations: ['Standard Seven'],
    starterCount: 7,
    maxSubstitutes: 5,
    positions: ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'],
  },
  HOCKEY: {
    formations: ['Standard Six'],
    starterCount: 6,
    maxSubstitutes: 12,
    positions: ['G', 'LD', 'RD', 'LW', 'C', 'RW'],
  },
  LACROSSE: {
    formations: ['Standard Ten'],
    starterCount: 10,
    maxSubstitutes: 13,
    positions: ['G', 'D', 'LSM', 'DM', 'M', 'A', 'FOGO'],
  },
  AUSTRALIAN_RULES: {
    formations: ['Standard Eighteen'],
    starterCount: 18,
    maxSubstitutes: 4,
    positions: ['FB', 'BP', 'CHB', 'HBF', 'W', 'C', 'HFF', 'CHF', 'FF', 'R', 'RR', 'ROV'],
  },
  GAELIC_FOOTBALL: {
    formations: ['Standard Fifteen'],
    starterCount: 15,
    maxSubstitutes: 8,
    positions: ['Goalkeeper', 'Corner Back', 'Full Back', 'Half Back', 'Midfielder', 'Half Forward', 'Corner Forward', 'Full Forward'],
  },
  FUTSAL: {
    formations: ['1-2-2', '2-2', '3-1', '4-0'],
    starterCount: 5,
    maxSubstitutes: 7,
    positions: ['GK', 'Fixo', 'Ala', 'Pivot'],
  },
  BEACH_FOOTBALL: {
    formations: ['2-1-2', '1-2-2', '2-2-1'],
    starterCount: 5,
    maxSubstitutes: 3,
    positions: ['GK', 'Defender', 'Winger', 'Pivot'],
  },
};

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const PlayerLineupSchema = z.object({
  playerId: z.string().min(1),
  position: z.string().nullable().optional(),
  shirtNumber: z.number().nullable().optional(),
  lineupPosition: z.number().nullable().optional(),
});

const TeamLineupSchema = z.object({
  starters: z.array(PlayerLineupSchema),
  substitutes: z.array(PlayerLineupSchema),
  captain: z.string().nullable().optional(),
  formation: z.string().nullable().optional(),
});

const UpdateLineupSchema = z.object({
  homeLineup: TeamLineupSchema.optional(),
  awayLineup: TeamLineupSchema.optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `lineup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const LINEUP_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
];

// =============================================================================
// GET HANDLER - Get Lineups
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

    // 2. Fetch match with squads
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeFormation: true,
        awayFormation: true,
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        homeClub: { select: { sport: true } },
        squads: {
          include: {
            player: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, avatar: true },
                },
              },
            },
          },
          orderBy: [
            { status: 'asc' },
            { lineupPosition: 'asc' },
            { substituteOrder: 'asc' },
          ],
        },
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

    const sport = match.homeClub.sport;
    const sportConfig = SPORT_FORMATIONS[sport];

    // 3. Categorize squads by team
    const homeSquad = match.squads.filter((s) => s.teamId === match.homeTeamId);
    const awaySquad = match.squads.filter((s) => s.teamId === match.awayTeamId);

    const transformPlayer = (s: typeof match.squads[0]): LineupPlayer => ({
      playerId: s.playerId,
      name: `${s.player.user.firstName} ${s.player.user.lastName}`,
      avatar: s.player.user.avatar,
      position: s.position,
      shirtNumber: s.shirtNumber || s.player.shirtNumber,
      lineupPosition: s.lineupPosition,
      status: s.status,
      isCaptain: s.isCaptain,
      substituteOrder: s.substituteOrder,
    });

    const homeLineup: TeamLineup = {
      teamId: match.homeTeamId,
      teamName: match.homeTeam.name,
      formation: match.homeFormation,
      starters: homeSquad
        .filter((s) => s.status === MatchSquadStatus.STARTING_LINEUP)
        .map(transformPlayer),
      substitutes: homeSquad
        .filter((s) => s.status === MatchSquadStatus.SUBSTITUTE)
        .map(transformPlayer),
      captain: homeSquad.find((s) => s.isCaptain)?.playerId || null,
      totalPlayers: homeSquad.length,
    };

    const awayLineup: TeamLineup = {
      teamId: match.awayTeamId,
      teamName: match.awayTeam.name,
      formation: match.awayFormation,
      starters: awaySquad
        .filter((s) => s.status === MatchSquadStatus.STARTING_LINEUP)
        .map(transformPlayer),
      substitutes: awaySquad
        .filter((s) => s.status === MatchSquadStatus.SUBSTITUTE)
        .map(transformPlayer),
      captain: awaySquad.find((s) => s.isCaptain)?.playerId || null,
      totalPlayers: awaySquad.length,
    };

    return createResponse({
      homeLineup,
      awayLineup,
      sport,
      sportConfig: {
        formations: sportConfig.formations,
        starterCount: sportConfig.starterCount,
        maxSubstitutes: sportConfig.maxSubstitutes,
        positions: sportConfig.positions,
      },
      isComplete: {
        home: homeLineup.starters.length === sportConfig.starterCount,
        away: awayLineup.starters.length === sportConfig.starterCount,
      },
    }, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Get Lineup error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch lineup',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PUT HANDLER - Update Lineups
// =============================================================================

export async function PUT(
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
        status: true,
        homeClub: { select: { sport: true } },
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

    const sport = match.homeClub.sport;
    const sportConfig = SPORT_FORMATIONS[sport];

    // 3. Authorization - check which team(s) user can manage
    const memberships = await prisma.clubMember.findMany({
      where: {
        userId: session.user.id,
        clubId: { in: [match.homeClubId, match.awayClubId] },
        isActive: true,
        role: { in: LINEUP_ROLES },
      },
      select: { clubId: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    const canManageHome = user?.isSuperAdmin || memberships.some((m) => m.clubId === match.homeClubId);
    const canManageAway = user?.isSuperAdmin || memberships.some((m) => m.clubId === match.awayClubId);

    if (!canManageHome && !canManageAway) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to manage lineups for this match',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
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

    const validation = UpdateLineupSchema.safeParse(body);
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

    // 5. Validate permissions for each lineup
    if (data.homeLineup && !canManageHome) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to manage the home team lineup',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    if (data.awayLineup && !canManageAway) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to manage the away team lineup',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 6. Validate lineup sizes
    if (data.homeLineup && data.homeLineup.starters.length > sportConfig.starterCount) {
      return createResponse(null, {
        success: false,
        error: `${sport} allows maximum ${sportConfig.starterCount} starters`,
        code: 'TOO_MANY_STARTERS',
        requestId,
        status: 400,
      });
    }

    if (data.awayLineup && data.awayLineup.starters.length > sportConfig.starterCount) {
      return createResponse(null, {
        success: false,
        error: `${sport} allows maximum ${sportConfig.starterCount} starters`,
        code: 'TOO_MANY_STARTERS',
        requestId,
        status: 400,
      });
    }

    // 7. Update lineups in transaction
    await prisma.$transaction(async (tx) => {
      // Update home lineup
      if (data.homeLineup) {
        // Delete existing home squad
        await tx.matchSquad.deleteMany({
          where: { matchId, teamId: match.homeTeamId },
        });

        // Create starters
        for (let i = 0; i < data.homeLineup.starters.length; i++) {
          const player = data.homeLineup.starters[i];
          await tx.matchSquad.create({
            data: {
              matchId,
              teamId: match.homeTeamId,
              playerId: player.playerId,
              position: player.position,
              shirtNumber: player.shirtNumber,
              lineupPosition: player.lineupPosition || i + 1,
              status: MatchSquadStatus.STARTING_LINEUP,
              isCaptain: player.playerId === data.homeLineup.captain,
            },
          });
        }

        // Create substitutes
        for (let i = 0; i < data.homeLineup.substitutes.length; i++) {
          const player = data.homeLineup.substitutes[i];
          await tx.matchSquad.create({
            data: {
              matchId,
              teamId: match.homeTeamId,
              playerId: player.playerId,
              position: player.position,
              shirtNumber: player.shirtNumber,
              status: MatchSquadStatus.SUBSTITUTE,
              substituteOrder: i + 1,
              isCaptain: false,
            },
          });
        }

        // Update match formation
        await tx.match.update({
          where: { id: matchId },
          data: { homeFormation: data.homeLineup.formation },
        });
      }

      // Update away lineup
      if (data.awayLineup) {
        // Delete existing away squad
        await tx.matchSquad.deleteMany({
          where: { matchId, teamId: match.awayTeamId },
        });

        // Create starters
        for (let i = 0; i < data.awayLineup.starters.length; i++) {
          const player = data.awayLineup.starters[i];
          await tx.matchSquad.create({
            data: {
              matchId,
              teamId: match.awayTeamId,
              playerId: player.playerId,
              position: player.position,
              shirtNumber: player.shirtNumber,
              lineupPosition: player.lineupPosition || i + 1,
              status: MatchSquadStatus.STARTING_LINEUP,
              isCaptain: player.playerId === data.awayLineup.captain,
            },
          });
        }

        // Create substitutes
        for (let i = 0; i < data.awayLineup.substitutes.length; i++) {
          const player = data.awayLineup.substitutes[i];
          await tx.matchSquad.create({
            data: {
              matchId,
              teamId: match.awayTeamId,
              playerId: player.playerId,
              position: player.position,
              shirtNumber: player.shirtNumber,
              status: MatchSquadStatus.SUBSTITUTE,
              substituteOrder: i + 1,
              isCaptain: false,
            },
          });
        }

        // Update match formation
        await tx.match.update({
          where: { id: matchId },
          data: { awayFormation: data.awayLineup.formation },
        });
      }
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LINEUP_UPDATED',
        resourceType: 'MATCH',
        resourceId: matchId,
        afterState: {
          homeUpdated: !!data.homeLineup,
          awayUpdated: !!data.awayLineup,
          homeStarters: data.homeLineup?.starters.length,
          awayStarters: data.awayLineup?.starters.length,
        },
      },
    });

    return createResponse({
      matchId,
      updated: {
        home: !!data.homeLineup,
        away: !!data.awayLineup,
      },
      homeFormation: data.homeLineup?.formation,
      awayFormation: data.awayLineup?.formation,
    }, {
      success: true,
      message: 'Lineup updated successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Update Lineup error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update lineup',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}