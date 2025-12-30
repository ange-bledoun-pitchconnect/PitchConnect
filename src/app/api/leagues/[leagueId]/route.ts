// =============================================================================
// 🏆 SINGLE LEAGUE API - Enterprise-Grade Implementation
// =============================================================================
// GET    /api/leagues/[leagueId] - Get league details with standings & matches
// PATCH  /api/leagues/[leagueId] - Update league
// DELETE /api/leagues/[leagueId] - Delete league (soft delete)
// =============================================================================
// Schema: v7.8.0 | Model: Competition (League is legacy alias)
// Multi-Sport: ✅ All 12 sports supported
// NOTE: Consolidates update/route.ts into this file for cleaner architecture
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Prisma,
  Sport,
  CompetitionType,
  CompetitionFormat,
  CompetitionStatus,
  MatchStatus,
  AuditActionType,
} from '@prisma/client';

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
    leagueId: string;
  };
}

interface CompetitionSettings {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  bonusPointsEnabled: boolean;
  bonusPointsConfig?: Record<string, number>;
  tiebreakers: string[];
  minTeams: number;
  maxTeams: number;
  registrationOpen: boolean;
  registrationDeadline?: string;
  entryFee?: number;
  entryCurrency?: string;
  matchDuration?: number;
  extraTimeAllowed?: boolean;
  penaltyShootouts?: boolean;
  showGoalDifference: boolean;
  showForm: boolean;
  formMatchCount?: number;
}

interface StandingRow {
  position: number;
  team: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    club: {
      id: string;
      name: string;
      logo: string | null;
    } | null;
  } | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
  homeRecord: { w: number; d: number; l: number } | null;
  awayRecord: { w: number; d: number; l: number } | null;
}

interface RecentMatch {
  id: string;
  homeTeam: { id: string; name: string; logo: string | null };
  awayTeam: { id: string; name: string; logo: string | null };
  homeScore: number | null;
  awayScore: number | null;
  kickOffTime: string;
  status: MatchStatus;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const updateLeagueSchema = z.object({
  // Basic info
  name: z.string().min(3).max(200).optional(),
  shortName: z.string().max(50).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  
  // Classification
  type: z.nativeEnum(CompetitionType).optional(),
  format: z.nativeEnum(CompetitionFormat).optional(),
  status: z.nativeEnum(CompetitionStatus).optional(),
  
  // Location
  country: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  
  // Dates
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  
  // Settings updates (partial)
  settings: z.object({
    pointsForWin: z.number().int().min(0).optional(),
    pointsForDraw: z.number().int().min(0).optional(),
    pointsForLoss: z.number().int().min(0).optional(),
    bonusPointsEnabled: z.boolean().optional(),
    bonusPointsConfig: z.record(z.number()).optional(),
    tiebreakers: z.array(z.string()).optional(),
    minTeams: z.number().int().min(2).optional(),
    maxTeams: z.number().int().min(2).max(256).optional(),
    registrationOpen: z.boolean().optional(),
    registrationDeadline: z.string().datetime().optional().nullable(),
    entryFee: z.number().min(0).optional(),
    entryCurrency: z.string().length(3).optional(),
    matchDuration: z.number().int().min(1).optional(),
    extraTimeAllowed: z.boolean().optional(),
    penaltyShootouts: z.boolean().optional(),
    showGoalDifference: z.boolean().optional(),
    showForm: z.boolean().optional(),
    formMatchCount: z.number().int().min(1).max(20).optional(),
  }).optional(),
  
  // Rules
  rules: z.record(z.unknown()).optional().nullable(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `league_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    message?: string;
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

  if (options.success && data !== null) {
    response.data = data;
  }
  if (options.message) response.message = options.message;
  if (options.error) response.error = options.error;
  if (options.code) response.code = options.code;

  return NextResponse.json(response, { status: options.status || 200 });
}

/**
 * Check if user has permission to manage this competition
 */
async function hasLeagueManagementPermission(
  userId: string,
  competition: {
    createdBy: string;
    organisationId: string | null;
    clubId: string | null;
  }
): Promise<boolean> {
  // Creator always has permission
  if (competition.createdBy === userId) return true;

  // Check super admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, roles: true },
  });
  if (user?.isSuperAdmin) return true;
  if (user?.roles?.includes('LEAGUE_ADMIN')) return true;

  // Check organisation role
  if (competition.organisationId) {
    const orgMember = await prisma.organisationMember.findFirst({
      where: {
        userId,
        organisationId: competition.organisationId,
        role: { in: ['OWNER', 'ADMIN', 'LEAGUE_MANAGER'] },
      },
    });
    if (orgMember) return true;
  }

  // Check club role
  if (competition.clubId) {
    const clubMember = await prisma.clubMember.findFirst({
      where: {
        userId,
        clubId: competition.clubId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    });
    if (clubMember) return true;
  }

  return false;
}

/**
 * Validate status transition
 */
function isValidStatusTransition(
  currentStatus: CompetitionStatus,
  newStatus: CompetitionStatus
): boolean {
  const validTransitions: Record<CompetitionStatus, CompetitionStatus[]> = {
    DRAFT: [CompetitionStatus.REGISTRATION, CompetitionStatus.CANCELLED],
    REGISTRATION: [CompetitionStatus.ACTIVE, CompetitionStatus.IN_PROGRESS, CompetitionStatus.CANCELLED, CompetitionStatus.DRAFT],
    ACTIVE: [CompetitionStatus.IN_PROGRESS, CompetitionStatus.COMPLETED, CompetitionStatus.CANCELLED, CompetitionStatus.PAUSED],
    IN_PROGRESS: [CompetitionStatus.COMPLETED, CompetitionStatus.PAUSED, CompetitionStatus.CANCELLED],
    PAUSED: [CompetitionStatus.IN_PROGRESS, CompetitionStatus.ACTIVE, CompetitionStatus.CANCELLED],
    COMPLETED: [CompetitionStatus.ARCHIVED],
    ARCHIVED: [], // Terminal state
    CANCELLED: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Get sport-specific scoring label
 */
function getScoringLabels(sport: Sport): { for: string; against: string; difference: string } {
  const labels: Record<Sport, { for: string; against: string; difference: string }> = {
    FOOTBALL: { for: 'GF', against: 'GA', difference: 'GD' },
    FUTSAL: { for: 'GF', against: 'GA', difference: 'GD' },
    BEACH_FOOTBALL: { for: 'GF', against: 'GA', difference: 'GD' },
    RUGBY: { for: 'PF', against: 'PA', difference: 'PD' },
    CRICKET: { for: 'RF', against: 'RA', difference: 'NRR' },
    AMERICAN_FOOTBALL: { for: 'PF', against: 'PA', difference: 'PD' },
    BASKETBALL: { for: 'PF', against: 'PA', difference: 'PD' },
    HOCKEY: { for: 'GF', against: 'GA', difference: 'GD' },
    LACROSSE: { for: 'GF', against: 'GA', difference: 'GD' },
    NETBALL: { for: 'GF', against: 'GA', difference: 'GD' },
    AUSTRALIAN_RULES: { for: 'PF', against: 'PA', difference: '%' },
    GAELIC_FOOTBALL: { for: 'SF', against: 'SA', difference: 'SD' },
  };
  return labels[sport] || { for: 'F', against: 'A', difference: 'D' };
}

// =============================================================================
// GET HANDLER - Get League Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { leagueId } = params;

  try {
    // Validate leagueId
    if (!leagueId || leagueId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid league ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // Fetch competition with all related data
    const competition = await prisma.competition.findUnique({
      where: { id: leagueId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            sport: true,
            city: true,
            country: true,
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        standings: {
          orderBy: [{ position: 'asc' }],
          include: {
            team: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
                club: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
            standings: true,
          },
        },
      },
    });

    if (!competition || competition.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'League not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // Get session for permission check
    const session = await getServerSession(authOptions);
    
    // Check visibility permissions
    const settings = (competition.settings as CompetitionSettings) || {};
    const isPrivate = !settings.registrationOpen && competition.status === CompetitionStatus.DRAFT;
    
    if (isPrivate && session?.user?.id) {
      const hasAccess = await hasLeagueManagementPermission(session.user.id, {
        createdBy: competition.createdBy,
        organisationId: competition.organisationId,
        clubId: competition.clubId,
      });
      
      if (!hasAccess) {
        return createResponse(null, {
          success: false,
          error: 'League not found',
          code: 'NOT_FOUND',
          requestId,
          status: 404,
        });
      }
    }

    // Fetch recent matches
    const recentMatches = await prisma.match.findMany({
      where: {
        competitionId: leagueId,
        deletedAt: null,
        status: MatchStatus.COMPLETED,
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, logo: true },
        },
        awayTeam: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { kickOffTime: 'desc' },
      take: 10,
    });

    // Fetch upcoming matches
    const upcomingMatches = await prisma.match.findMany({
      where: {
        competitionId: leagueId,
        deletedAt: null,
        status: { in: [MatchStatus.SCHEDULED, MatchStatus.CONFIRMED] },
        kickOffTime: { gte: new Date() },
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, logo: true },
        },
        awayTeam: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { kickOffTime: 'asc' },
      take: 10,
    });

    // Fetch live matches
    const liveMatches = await prisma.match.findMany({
      where: {
        competitionId: leagueId,
        deletedAt: null,
        status: { in: [MatchStatus.LIVE, MatchStatus.HALF_TIME] },
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, logo: true },
        },
        awayTeam: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    // Calculate top scorers if matches exist
    const topScorers = await prisma.matchEvent.groupBy({
      by: ['playerId'],
      where: {
        match: { competitionId: leagueId },
        eventType: 'GOAL',
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get player details for top scorers
    let formattedTopScorers: Array<{ player: { id: string; name: string }; goals: number }> = [];
    if (topScorers.length > 0) {
      const playerIds = topScorers.map((s) => s.playerId).filter(Boolean) as string[];
      const players = await prisma.player.findMany({
        where: { id: { in: playerIds } },
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      });
      
      const playerMap = new Map(players.map((p) => [p.id, p]));
      formattedTopScorers = topScorers
        .filter((s) => s.playerId)
        .map((s) => {
          const player = playerMap.get(s.playerId!);
          return {
            player: {
              id: s.playerId!,
              name: player ? `${player.user.firstName} ${player.user.lastName}` : 'Unknown',
            },
            goals: s._count.id,
          };
        });
    }

    // Format standings
    const formattedStandings: StandingRow[] = competition.standings.map((s, index) => ({
      position: s.position || index + 1,
      team: s.team,
      played: s.played,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDifference: s.goalDifference,
      points: s.points,
      form: s.form,
      homeRecord: s.homeWins !== null ? {
        w: s.homeWins,
        d: s.homeDraws ?? 0,
        l: s.homeLosses ?? 0,
      } : null,
      awayRecord: s.awayWins !== null ? {
        w: s.awayWins,
        d: s.awayDraws ?? 0,
        l: s.awayLosses ?? 0,
      } : null,
    }));

    // Format matches
    const formatMatch = (match: typeof recentMatches[0]): RecentMatch => ({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      kickOffTime: match.kickOffTime.toISOString(),
      status: match.status,
    });

    // Get scoring labels
    const scoringLabels = getScoringLabels(competition.sport);

    // Check if user can manage
    let canManage = false;
    if (session?.user?.id) {
      canManage = await hasLeagueManagementPermission(session.user.id, {
        createdBy: competition.createdBy,
        organisationId: competition.organisationId,
        clubId: competition.clubId,
      });
    }

    // Format response
    const response = {
      id: competition.id,
      name: competition.name,
      shortName: competition.shortName,
      slug: competition.slug,
      code: competition.slug, // Legacy alias
      sport: competition.sport,
      type: competition.type,
      format: competition.format,
      status: competition.status,
      season: competition.season,
      country: competition.country,
      region: competition.region,
      description: competition.description,
      logo: competition.logo,
      banner: competition.banner,
      
      // Legacy visibility
      visibility: settings.registrationOpen ? 'PUBLIC' : 'PRIVATE',
      
      // Ownership
      club: competition.club,
      organisation: competition.organisation,
      admin: competition.creator
        ? {
            id: competition.creator.id,
            name: `${competition.creator.firstName} ${competition.creator.lastName}`,
            email: competition.creator.email,
          }
        : null,
      
      // Configuration
      configuration: {
        pointsWin: settings.pointsForWin ?? 3,
        pointsDraw: settings.pointsForDraw ?? 1,
        pointsLoss: settings.pointsForLoss ?? 0,
        minTeams: settings.minTeams ?? 2,
        maxTeams: settings.maxTeams ?? 20,
        bonusPointsEnabled: settings.bonusPointsEnabled ?? false,
        bonusPointsConfig: settings.bonusPointsConfig,
        tiebreakers: settings.tiebreakers ?? [],
        registrationOpen: settings.registrationOpen ?? true,
        registrationDeadline: settings.registrationDeadline,
        matchDuration: settings.matchDuration,
        extraTimeAllowed: settings.extraTimeAllowed,
        penaltyShootouts: settings.penaltyShootouts,
        showGoalDifference: settings.showGoalDifference ?? true,
        showForm: settings.showForm ?? true,
      },
      
      // Scoring labels (sport-specific)
      scoringLabels,
      
      // Statistics
      statistics: {
        teamCount: competition._count.teams,
        matchCount: competition._count.matches,
        completedMatches: competition.completedMatches,
        totalGoals: competition.totalGoals,
        averageGoalsPerMatch: competition.completedMatches > 0
          ? Math.round((competition.totalGoals / competition.completedMatches) * 100) / 100
          : 0,
      },
      
      // Standings
      standings: formattedStandings,
      
      // Matches
      matches: {
        live: liveMatches.map(formatMatch),
        upcoming: upcomingMatches.map(formatMatch),
        recent: recentMatches.map(formatMatch),
      },
      
      // Top scorers
      topScorers: formattedTopScorers,
      
      // Rules
      rules: competition.rules,
      
      // User context
      canManage,
      
      // Dates
      startDate: competition.startDate?.toISOString(),
      endDate: competition.endDate?.toISOString(),
      createdAt: competition.createdAt.toISOString(),
      updatedAt: competition.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: 'League retrieved successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] League GET error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to fetch league',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// PATCH HANDLER - Update League
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { leagueId } = params;

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

    // 2. Validate leagueId
    if (!leagueId || leagueId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid league ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // 3. Fetch existing competition
    const existingCompetition = await prisma.competition.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        status: true,
        settings: true,
        createdBy: true,
        organisationId: true,
        clubId: true,
        deletedAt: true,
      },
    });

    if (!existingCompetition || existingCompetition.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'League not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Check permission
    const hasPermission = await hasLeagueManagementPermission(session.user.id, {
      createdBy: existingCompetition.createdBy,
      organisationId: existingCompetition.organisationId,
      clubId: existingCompetition.clubId,
    });

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to update this league',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 5. Parse and validate request body
    let body: unknown;
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

    const validation = updateLeagueSchema.safeParse(body);
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

    // 6. Validate status transition if status is being changed
    if (data.status && data.status !== existingCompetition.status) {
      if (!isValidStatusTransition(existingCompetition.status, data.status)) {
        return createResponse(null, {
          success: false,
          error: `Invalid status transition from ${existingCompetition.status} to ${data.status}`,
          code: 'INVALID_STATUS_TRANSITION',
          requestId,
          status: 400,
        });
      }
    }

    // 7. Build update data
    const updateData: Prisma.CompetitionUpdateInput = {};
    const changedFields: string[] = [];

    // Direct fields
    const directFields = [
      'name', 'shortName', 'description', 'logo', 'banner',
      'type', 'format', 'status', 'country', 'region',
    ] as const;

    for (const field of directFields) {
      if (data[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = data[field];
        changedFields.push(field);
      }
    }

    // Date fields
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
      changedFields.push('startDate');
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      changedFields.push('endDate');
    }

    // Merge settings
    if (data.settings) {
      const currentSettings = (existingCompetition.settings as CompetitionSettings) || {};
      const mergedSettings = {
        ...currentSettings,
        ...data.settings,
      };
      updateData.settings = mergedSettings as unknown as Prisma.JsonObject;
      changedFields.push('settings');
    }

    // Rules
    if (data.rules !== undefined) {
      updateData.rules = data.rules as Prisma.JsonObject;
      changedFields.push('rules');
    }

    // 8. Check if there are any changes
    if (changedFields.length === 0) {
      return createResponse(
        {
          id: existingCompetition.id,
          name: existingCompetition.name,
          changedFields: [],
        },
        {
          success: true,
          message: 'No changes provided',
          requestId,
        }
      );
    }

    // 9. Update competition
    const updatedCompetition = await prisma.competition.update({
      where: { id: leagueId },
      data: updateData,
      include: {
        club: {
          select: { id: true, name: true, logo: true },
        },
        organisation: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'COMPETITION_UPDATED' as AuditActionType,
        resourceType: 'COMPETITION',
        resourceId: leagueId,
        beforeState: {
          name: existingCompetition.name,
          status: existingCompetition.status,
        },
        afterState: updateData as Record<string, unknown>,
        changes: changedFields,
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    // 11. Format response
    const updatedSettings = (updatedCompetition.settings as CompetitionSettings) || {};
    
    const response = {
      id: updatedCompetition.id,
      name: updatedCompetition.name,
      shortName: updatedCompetition.shortName,
      slug: updatedCompetition.slug,
      sport: updatedCompetition.sport,
      type: updatedCompetition.type,
      format: updatedCompetition.format,
      status: updatedCompetition.status,
      visibility: updatedSettings.registrationOpen ? 'PUBLIC' : 'PRIVATE',
      
      club: updatedCompetition.club,
      organisation: updatedCompetition.organisation,
      
      configuration: {
        pointsWin: updatedSettings.pointsForWin ?? 3,
        pointsDraw: updatedSettings.pointsForDraw ?? 1,
        pointsLoss: updatedSettings.pointsForLoss ?? 0,
        minTeams: updatedSettings.minTeams ?? 2,
        maxTeams: updatedSettings.maxTeams ?? 20,
        bonusPointsEnabled: updatedSettings.bonusPointsEnabled ?? false,
        registrationOpen: updatedSettings.registrationOpen ?? true,
      },
      
      changedFields,
      updatedAt: updatedCompetition.updatedAt.toISOString(),
    };

    return createResponse(response, {
      success: true,
      message: `League "${updatedCompetition.name}" updated successfully`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] League PATCH error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to update league',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// DELETE HANDLER - Soft Delete League
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const { leagueId } = params;

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

    // 2. Validate leagueId
    if (!leagueId || leagueId.length < 20) {
      return createResponse(null, {
        success: false,
        error: 'Invalid league ID',
        code: 'INVALID_ID',
        requestId,
        status: 400,
      });
    }

    // 3. Fetch existing competition
    const existingCompetition = await prisma.competition.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        status: true,
        createdBy: true,
        organisationId: true,
        clubId: true,
        deletedAt: true,
        _count: {
          select: {
            matches: true,
            teams: true,
          },
        },
      },
    });

    if (!existingCompetition || existingCompetition.deletedAt) {
      return createResponse(null, {
        success: false,
        error: 'League not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Check permission
    const hasPermission = await hasLeagueManagementPermission(session.user.id, {
      createdBy: existingCompetition.createdBy,
      organisationId: existingCompetition.organisationId,
      clubId: existingCompetition.clubId,
    });

    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to delete this league',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 5. Check if league can be deleted
    const inProgressStatuses: CompetitionStatus[] = [
      CompetitionStatus.ACTIVE,
      CompetitionStatus.IN_PROGRESS,
    ];

    if (inProgressStatuses.includes(existingCompetition.status)) {
      return createResponse(null, {
        success: false,
        error: `Cannot delete a league with status: ${existingCompetition.status}. Please complete or cancel it first.`,
        code: 'INVALID_OPERATION',
        requestId,
        status: 400,
      });
    }

    // Warn if league has completed matches
    if (existingCompetition._count.matches > 0) {
      console.warn(
        `[${requestId}] Deleting league ${leagueId} with ${existingCompetition._count.matches} matches`
      );
    }

    // 6. Soft delete
    await prisma.competition.update({
      where: { id: leagueId },
      data: {
        deletedAt: new Date(),
        status: CompetitionStatus.CANCELLED,
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'COMPETITION_DELETED' as AuditActionType,
        resourceType: 'COMPETITION',
        resourceId: leagueId,
        beforeState: {
          name: existingCompetition.name,
          status: existingCompetition.status,
          matchCount: existingCompetition._count.matches,
          teamCount: existingCompetition._count.teams,
        },
      },
    }).catch((err) => {
      console.error(`[${requestId}] Audit log failed:`, err);
    });

    return createResponse(null, {
      success: true,
      message: `League "${existingCompetition.name}" deleted successfully`,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] League DELETE error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to delete league',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
