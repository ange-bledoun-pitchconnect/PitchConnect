// =============================================================================
// 🏆 MATCH RESULT API - Enterprise-Grade Multi-Sport Implementation
// =============================================================================
// POST /api/manager/clubs/[clubId]/teams/[teamId]/matches/[matchId]/result
// Record final match result and update competition standings
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Club Owner, Manager, Head Coach
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, ClubMemberRole, MatchStatus } from '@prisma/client';

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
    matchId: string;
  };
}

interface ResultResponse {
  matchId: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  winner: 'HOME' | 'AWAY' | 'DRAW' | null;
  standingsUpdated: boolean;
  playerStatsUpdated: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const RecordResultSchema = z.object({
  homeScore: z.number().int().min(0).max(999),
  awayScore: z.number().int().min(0).max(999),
  homeHalftimeScore: z.number().int().min(0).max(999).optional(),
  awayHalftimeScore: z.number().int().min(0).max(999).optional(),
  homePenaltyScore: z.number().int().min(0).max(99).optional(),
  awayPenaltyScore: z.number().int().min(0).max(99).optional(),
  attendance: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
  markAsCompleted: z.boolean().default(true),
  updateStandings: z.boolean().default(true),
  updatePlayerStats: z.boolean().default(true),
});

// =============================================================================
// SPORT-SPECIFIC CONFIGURATIONS
// =============================================================================

// Points for standings
const SPORT_POINTS_CONFIG: Record<Sport, { win: number; draw: number; loss: number }> = {
  FOOTBALL: { win: 3, draw: 1, loss: 0 },
  FUTSAL: { win: 3, draw: 1, loss: 0 },
  BEACH_FOOTBALL: { win: 3, draw: 1, loss: 0 },
  RUGBY: { win: 4, draw: 2, loss: 0 }, // Simplified - full rugby has bonus points
  CRICKET: { win: 2, draw: 1, loss: 0 },
  AMERICAN_FOOTBALL: { win: 1, draw: 0, loss: 0 }, // W-L record
  BASKETBALL: { win: 2, draw: 0, loss: 1 }, // Some leagues use 2-1 system
  HOCKEY: { win: 3, draw: 1, loss: 0 },
  LACROSSE: { win: 2, draw: 0, loss: 0 },
  NETBALL: { win: 2, draw: 1, loss: 0 },
  AUSTRALIAN_RULES: { win: 4, draw: 2, loss: 0 },
  GAELIC_FOOTBALL: { win: 2, draw: 1, loss: 0 },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `result_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const EDIT_ROLES = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
];

async function hasEditPermission(userId: string, clubId: string): Promise<boolean> {
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
      role: { in: EDIT_ROLES },
    },
  });

  return !!clubMember;
}

function determineWinner(
  homeScore: number,
  awayScore: number
): 'HOME' | 'AWAY' | 'DRAW' {
  if (homeScore > awayScore) return 'HOME';
  if (awayScore > homeScore) return 'AWAY';
  return 'DRAW';
}

// =============================================================================
// POST HANDLER - Record Match Result
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { clubId, teamId, matchId } = params;

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
    const canEdit = await hasEditPermission(session.user.id, clubId);
    if (!canEdit) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to record match results',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Get club sport
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, sport: true },
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

    // 4. Verify team belongs to club
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true },
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

    // 5. Fetch match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        competitionId: true,
        status: true,
        homeScore: true,
        awayScore: true,
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

    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) {
      return createResponse(null, {
        success: false,
        error: 'Match not found for this team',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 6. Parse and validate body
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

    const validation = RecordResultSchema.safeParse(body);
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
      homeScore,
      awayScore,
      homeHalftimeScore,
      awayHalftimeScore,
      homePenaltyScore,
      awayPenaltyScore,
      attendance,
      notes,
      markAsCompleted,
      updateStandings,
      updatePlayerStats,
    } = validation.data;

    const winner = determineWinner(homeScore, awayScore);
    const pointsConfig = SPORT_POINTS_CONFIG[club.sport];

    // 7. Check if match is already completed
    const wasAlreadyCompleted = match.status === 'COMPLETED';

    // 8. Transaction: Update match and standings
    await prisma.$transaction(async (tx) => {
      // Update match
      await tx.match.update({
        where: { id: matchId },
        data: {
          homeScore,
          awayScore,
          homeHalftimeScore: homeHalftimeScore ?? null,
          awayHalftimeScore: awayHalftimeScore ?? null,
          homePenaltyScore: homePenaltyScore ?? null,
          awayPenaltyScore: awayPenaltyScore ?? null,
          attendance: attendance ?? null,
          notes: notes ?? null,
          status: markAsCompleted ? MatchStatus.COMPLETED : match.status,
          endTime: markAsCompleted ? new Date() : null,
        },
      });

      // Update standings if in a competition
      if (updateStandings && match.competitionId && !wasAlreadyCompleted) {
        // Get or create home team standing
        const homeStanding = await tx.competitionStanding.upsert({
          where: {
            competitionId_teamId: {
              competitionId: match.competitionId,
              teamId: match.homeTeamId,
            },
          },
          create: {
            competitionId: match.competitionId,
            teamId: match.homeTeamId,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            position: 0,
          },
          update: {},
        });

        // Get or create away team standing
        const awayStanding = await tx.competitionStanding.upsert({
          where: {
            competitionId_teamId: {
              competitionId: match.competitionId,
              teamId: match.awayTeamId,
            },
          },
          create: {
            competitionId: match.competitionId,
            teamId: match.awayTeamId,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            position: 0,
          },
          update: {},
        });

        // Calculate points
        let homePoints = 0;
        let awayPoints = 0;
        let homeWon = 0, homeDraw = 0, homeLost = 0;
        let awayWon = 0, awayDraw = 0, awayLost = 0;

        if (winner === 'HOME') {
          homePoints = pointsConfig.win;
          awayPoints = pointsConfig.loss;
          homeWon = 1;
          awayLost = 1;
        } else if (winner === 'AWAY') {
          homePoints = pointsConfig.loss;
          awayPoints = pointsConfig.win;
          homeLost = 1;
          awayWon = 1;
        } else {
          homePoints = pointsConfig.draw;
          awayPoints = pointsConfig.draw;
          homeDraw = 1;
          awayDraw = 1;
        }

        // Update home team standing
        await tx.competitionStanding.update({
          where: { id: homeStanding.id },
          data: {
            played: { increment: 1 },
            won: { increment: homeWon },
            drawn: { increment: homeDraw },
            lost: { increment: homeLost },
            goalsFor: { increment: homeScore },
            goalsAgainst: { increment: awayScore },
            goalDifference: homeStanding.goalDifference + (homeScore - awayScore),
            points: { increment: homePoints },
          },
        });

        // Update away team standing
        await tx.competitionStanding.update({
          where: { id: awayStanding.id },
          data: {
            played: { increment: 1 },
            won: { increment: awayWon },
            drawn: { increment: awayDraw },
            lost: { increment: awayLost },
            goalsFor: { increment: awayScore },
            goalsAgainst: { increment: homeScore },
            goalDifference: awayStanding.goalDifference + (awayScore - homeScore),
            points: { increment: awayPoints },
          },
        });

        // Recalculate positions for all teams in competition
        const allStandings = await tx.competitionStanding.findMany({
          where: { competitionId: match.competitionId },
          orderBy: [
            { points: 'desc' },
            { goalDifference: 'desc' },
            { goalsFor: 'desc' },
          ],
        });

        for (let i = 0; i < allStandings.length; i++) {
          await tx.competitionStanding.update({
            where: { id: allStandings[i].id },
            data: { position: i + 1 },
          });
        }

        // Update competition stats
        await tx.competition.update({
          where: { id: match.competitionId },
          data: {
            completedMatches: { increment: 1 },
            totalGoals: { increment: homeScore + awayScore },
          },
        });
      }

      // Update player statistics if requested
      if (updatePlayerStats) {
        // Get all lineup entries for this match
        const lineupEntries = await tx.matchLineup.findMany({
          where: { matchId },
          select: {
            playerId: true,
            teamId: true,
            minutesPlayed: true,
          },
        });

        // Update minutes played for each player
        for (const entry of lineupEntries) {
          if (entry.minutesPlayed && entry.minutesPlayed > 0) {
            await tx.playerStatistics.upsert({
              where: {
                playerId_seasonId: {
                  playerId: entry.playerId,
                  seasonId: 'current', // Would need actual season ID
                },
              },
              create: {
                playerId: entry.playerId,
                seasonId: 'current',
                appearances: 1,
                minutesPlayed: entry.minutesPlayed,
              },
              update: {
                appearances: { increment: 1 },
                minutesPlayed: { increment: entry.minutesPlayed },
              },
            });
          }
        }
      }
    });

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'MATCH',
        entityId: matchId,
        description: `Recorded result: ${homeScore}-${awayScore}`,
        metadata: {
          matchId,
          homeScore,
          awayScore,
          winner,
          standingsUpdated: updateStandings && !!match.competitionId,
          playerStatsUpdated: updatePlayerStats,
        },
      },
    });

    // 10. Build response
    const response: ResultResponse = {
      matchId,
      status: markAsCompleted ? MatchStatus.COMPLETED : match.status,
      homeScore,
      awayScore,
      winner: winner === 'DRAW' ? 'DRAW' : winner,
      standingsUpdated: updateStandings && !!match.competitionId && !wasAlreadyCompleted,
      playerStatsUpdated: updatePlayerStats,
    };

    return createResponse(response, {
      success: true,
      message: 'Match result recorded successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Record Result error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to record match result',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
