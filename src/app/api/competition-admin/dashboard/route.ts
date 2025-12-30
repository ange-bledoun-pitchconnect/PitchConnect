// =============================================================================
// 🏆 COMPETITION ADMIN DASHBOARD API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/competition-admin/dashboard - Get competition admin dashboard data
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅
// NOTE: Replaces old /api/league-admin/dashboard (League model doesn't exist)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MatchStatus, Sport } from '@prisma/client';

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

interface CompetitionSummary {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  sport: Sport;
  type: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string | null;
  teamCount: number;
  totalMatches: number;
  completedMatches: number;
  totalGoals: number;
  upcomingMatches: number;
}

interface StandingSummary {
  id: string;
  competitionId: string;
  competitionName: string;
  position: number;
  teamId: string | null;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
}

interface MatchSummary {
  id: string;
  competitionId: string | null;
  competitionName: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  kickOffTime: string;
  sport: Sport;
}

interface DashboardStats {
  totalCompetitions: number;
  activeCompetitions: number;
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  upcomingMatches: number;
  liveMatches: number;
  totalGoals: number;
  pendingApprovals: number;
  sportBreakdown: Record<Sport, number>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `cad_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 * Get competitions the user can administer
 */
async function getAdministrableCompetitions(userId: string): Promise<string[]> {
  const competitionIds: string[] = [];

  // 1. Check if super admin (can admin all)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  if (user?.isSuperAdmin) {
    const allCompetitions = await prisma.competition.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    return allCompetitions.map((c) => c.id);
  }

  // 2. Competitions created by user
  const createdCompetitions = await prisma.competition.findMany({
    where: {
      createdBy: userId,
      deletedAt: null,
    },
    select: { id: true },
  });
  competitionIds.push(...createdCompetitions.map((c) => c.id));

  // 3. Organisation-level admins (OWNER, ADMIN, LEAGUE_MANAGER)
  const orgMemberships = await prisma.organisationMember.findMany({
    where: {
      userId,
      role: { in: ['OWNER', 'ADMIN', 'LEAGUE_MANAGER'] },
    },
    select: {
      organisation: {
        select: {
          competitions: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      },
    },
  });

  for (const membership of orgMemberships) {
    competitionIds.push(...membership.organisation.competitions.map((c) => c.id));
  }

  // 4. Club-level admins for club competitions
  const clubMemberships = await prisma.clubMember.findMany({
    where: {
      userId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER'] },
    },
    select: {
      club: {
        select: {
          competitions: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      },
    },
  });

  for (const membership of clubMemberships) {
    competitionIds.push(...membership.club.competitions.map((c) => c.id));
  }

  // Return unique IDs
  return [...new Set(competitionIds)];
}

// =============================================================================
// GET HANDLER - Competition Admin Dashboard
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

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

    // 2. Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        roles: true,
        isSuperAdmin: true,
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

    // 3. Get administrable competition IDs
    const competitionIds = await getAdministrableCompetitions(user.id);

    if (competitionIds.length === 0) {
      return createResponse(null, {
        success: false,
        error: 'You do not have access to any competitions',
        code: 'NO_COMPETITIONS',
        requestId,
        status: 403,
      });
    }

    // 4. Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const sportFilter = searchParams.get('sport') as Sport | null;
    const statusFilter = searchParams.get('status');

    // 5. Fetch competitions with details
    const competitions = await prisma.competition.findMany({
      where: {
        id: { in: competitionIds },
        deletedAt: null,
        ...(sportFilter && { sport: sportFilter }),
        ...(statusFilter && { status: statusFilter }),
      },
      include: {
        teams: {
          select: { id: true },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 6. Get upcoming matches count for each competition
    const upcomingMatchesCounts = await prisma.match.groupBy({
      by: ['competitionId'],
      where: {
        competitionId: { in: competitionIds },
        deletedAt: null,
        status: { in: [MatchStatus.SCHEDULED, MatchStatus.CONFIRMED] },
        kickOffTime: { gte: new Date() },
      },
      _count: true,
    });

    const upcomingMap = new Map(
      upcomingMatchesCounts.map((uc) => [uc.competitionId, uc._count])
    );

    // 7. Format competition summaries
    const competitionSummaries: CompetitionSummary[] = competitions.map((comp) => ({
      id: comp.id,
      name: comp.name,
      shortName: comp.shortName,
      slug: comp.slug,
      sport: comp.sport,
      type: comp.type,
      format: comp.format,
      status: comp.status,
      startDate: comp.startDate.toISOString(),
      endDate: comp.endDate?.toISOString() ?? null,
      teamCount: comp._count.teams,
      totalMatches: comp.totalMatches,
      completedMatches: comp.completedMatches,
      totalGoals: comp.totalGoals,
      upcomingMatches: upcomingMap.get(comp.id) || 0,
    }));

    // 8. Fetch standings (top 5 per competition, limit to 3 competitions)
    const standingsCompetitionIds = competitionIds.slice(0, 3);
    const standings = await prisma.competitionStanding.findMany({
      where: {
        competitionId: { in: standingsCompetitionIds },
      },
      orderBy: [{ competitionId: 'asc' }, { position: 'asc' }],
      take: 15, // Top 5 per competition * 3 competitions
      include: {
        competition: {
          select: { name: true },
        },
      },
    });

    // Get team names for standings
    const teamIds = standings.map((s) => s.teamId).filter(Boolean) as string[];
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true },
    });
    const teamNameMap = new Map(teams.map((t) => [t.id, t.name]));

    const standingSummaries: StandingSummary[] = standings.map((s) => ({
      id: s.id,
      competitionId: s.competitionId,
      competitionName: s.competition.name,
      position: s.position,
      teamId: s.teamId,
      teamName: s.teamId ? teamNameMap.get(s.teamId) || 'Unknown' : 'Unknown',
      played: s.played,
      won: s.wins,
      drawn: s.draws,
      lost: s.losses,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDifference: s.goalDifference,
      points: s.points,
      form: s.form,
    }));

    // 9. Fetch recent and upcoming matches
    const now = new Date();
    const [recentMatches, upcomingMatches, liveMatches] = await Promise.all([
      // Recent completed matches
      prisma.match.findMany({
        where: {
          competitionId: { in: competitionIds },
          deletedAt: null,
          status: MatchStatus.COMPLETED,
        },
        include: {
          homeTeam: { select: { name: true, club: { select: { sport: true } } } },
          awayTeam: { select: { name: true } },
          competition: { select: { name: true } },
        },
        orderBy: { kickOffTime: 'desc' },
        take: 10,
      }),
      // Upcoming matches
      prisma.match.findMany({
        where: {
          competitionId: { in: competitionIds },
          deletedAt: null,
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.CONFIRMED] },
          kickOffTime: { gte: now },
        },
        include: {
          homeTeam: { select: { name: true, club: { select: { sport: true } } } },
          awayTeam: { select: { name: true } },
          competition: { select: { name: true } },
        },
        orderBy: { kickOffTime: 'asc' },
        take: 10,
      }),
      // Live matches
      prisma.match.findMany({
        where: {
          competitionId: { in: competitionIds },
          deletedAt: null,
          status: { in: [MatchStatus.LIVE, MatchStatus.HALF_TIME] },
        },
        include: {
          homeTeam: { select: { name: true, club: { select: { sport: true } } } },
          awayTeam: { select: { name: true } },
          competition: { select: { name: true } },
        },
      }),
    ]);

    const formatMatch = (match: typeof recentMatches[0]): MatchSummary => ({
      id: match.id,
      competitionId: match.competitionId,
      competitionName: match.competition?.name ?? null,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      kickOffTime: match.kickOffTime.toISOString(),
      sport: match.homeTeam.club.sport,
    });

    // 10. Get matches pending result approval
    const pendingApprovals = await prisma.match.count({
      where: {
        competitionId: { in: competitionIds },
        deletedAt: null,
        resultApprovalStatus: 'PENDING',
        status: MatchStatus.COMPLETED,
      },
    });

    // 11. Calculate aggregate stats
    const sportBreakdown = competitions.reduce(
      (acc, comp) => {
        acc[comp.sport] = (acc[comp.sport] || 0) + 1;
        return acc;
      },
      {} as Record<Sport, number>
    );

    const stats: DashboardStats = {
      totalCompetitions: competitions.length,
      activeCompetitions: competitions.filter((c) => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS').length,
      totalTeams: competitions.reduce((sum, c) => sum + c._count.teams, 0),
      totalMatches: competitions.reduce((sum, c) => sum + c.totalMatches, 0),
      completedMatches: competitions.reduce((sum, c) => sum + c.completedMatches, 0),
      upcomingMatches: upcomingMatches.length,
      liveMatches: liveMatches.length,
      totalGoals: competitions.reduce((sum, c) => sum + c.totalGoals, 0),
      pendingApprovals,
      sportBreakdown,
    };

    // 12. Get recent activity (audit logs)
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        resourceType: { in: ['MATCH', 'COMPETITION', 'COMPETITION_STANDING'] },
        resourceId: { in: competitionIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 13. Format response
    const response = {
      admin: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: user.avatar,
        roles: user.roles,
        isSuperAdmin: user.isSuperAdmin,
      },
      stats,
      competitions: competitionSummaries,
      standings: standingSummaries,
      matches: {
        live: liveMatches.map(formatMatch),
        upcoming: upcomingMatches.map(formatMatch),
        recent: recentMatches.map(formatMatch),
      },
      pendingApprovals: {
        count: pendingApprovals,
        url: '/dashboard/competition-admin/approvals',
      },
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        action: activity.action,
        resourceType: activity.resourceType,
        resourceId: activity.resourceId,
        user: activity.user
          ? `${activity.user.firstName} ${activity.user.lastName}`
          : 'System',
        timestamp: activity.createdAt.toISOString(),
      })),
      availableSports: Object.keys(sportBreakdown) as Sport[],
    };

    return createResponse(response, {
      success: true,
      message: 'Competition admin dashboard loaded successfully',
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Competition Admin Dashboard error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to load dashboard',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}
