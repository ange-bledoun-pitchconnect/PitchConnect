// =============================================================================
// 📊 MANAGER DASHBOARD API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/manager/dashboard
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Any manager/coach/analyst with club access
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClubMemberRole, Sport, MatchStatus, TrainingStatus, TimesheetStatus } from '@prisma/client';

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

interface ClubOverview {
  id: string;
  name: string;
  logo: string | null;
  sport: Sport;
  role: ClubMemberRole | 'OWNER';
  teamCount: number;
  memberCount: number;
  upcomingMatches: number;
  upcomingTraining: number;
}

interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickOffTime: string;
  venue: string | null;
  clubId: string;
  clubName: string;
  sport: Sport;
}

interface UpcomingTraining {
  id: string;
  name: string;
  teamName: string;
  startTime: string;
  location: string | null;
  attendanceCount: number;
  clubId: string;
  clubName: string;
}

interface PendingItem {
  id: string;
  type: 'JOIN_REQUEST' | 'TIMESHEET' | 'EXPENSE' | 'MATCH_APPROVAL';
  title: string;
  description: string;
  createdAt: string;
  clubId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  clubId: string;
  userId: string | null;
  userName: string | null;
}

interface DashboardStats {
  totalClubs: number;
  totalTeams: number;
  totalPlayers: number;
  matchesThisWeek: number;
  trainingThisWeek: number;
  pendingApprovals: number;
  attendanceRate: number | null;
}

interface DashboardResponse {
  user: {
    id: string;
    name: string;
    avatar: string | null;
    roles: string[];
  };
  stats: DashboardStats;
  clubs: ClubOverview[];
  upcomingMatches: UpcomingMatch[];
  upcomingTraining: UpcomingTraining[];
  pendingItems: PendingItem[];
  recentActivity: RecentActivity[];
  quickActions: Array<{
    label: string;
    action: string;
    icon: string;
    url: string;
  }>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `dash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const MANAGER_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
  ClubMemberRole.TREASURER,
];

// =============================================================================
// GET HANDLER - Manager Dashboard
// =============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

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

    const userId = session.user.id;

    // 2. Fetch user with roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
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

    // 3. Fetch owned clubs
    const ownedClubs = await prisma.club.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        logo: true,
        sport: true,
        _count: {
          select: {
            teams: { where: { deletedAt: null } },
            members: { where: { isActive: true } },
          },
        },
      },
    });

    // 4. Fetch clubs where user is a member with manager roles
    const memberClubs = await prisma.clubMember.findMany({
      where: {
        userId,
        isActive: true,
        role: { in: MANAGER_ROLES },
        club: {
          deletedAt: null,
          ownerId: { not: userId },
        },
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
            sport: true,
            _count: {
              select: {
                teams: { where: { deletedAt: null } },
                members: { where: { isActive: true } },
              },
            },
          },
        },
      },
    });

    // 5. Build club IDs for queries
    const allClubIds = [
      ...ownedClubs.map((c) => c.id),
      ...memberClubs.map((m) => m.club.id),
    ];

    if (allClubIds.length === 0) {
      // User has no clubs - return empty dashboard
      return createResponse({
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar,
          roles: user.roles,
        },
        stats: {
          totalClubs: 0,
          totalTeams: 0,
          totalPlayers: 0,
          matchesThisWeek: 0,
          trainingThisWeek: 0,
          pendingApprovals: 0,
          attendanceRate: null,
        },
        clubs: [],
        upcomingMatches: [],
        upcomingTraining: [],
        pendingItems: [],
        recentActivity: [],
        quickActions: [
          { label: 'Create Club', action: 'CREATE_CLUB', icon: 'plus', url: '/manager/clubs/new' },
          { label: 'Join Club', action: 'JOIN_CLUB', icon: 'users', url: '/clubs' },
        ],
      }, {
        success: true,
        requestId,
      });
    }

    // 6. Date ranges
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);

    // 7. Parallel data fetching
    const [
      upcomingMatches,
      upcomingTrainingSessions,
      pendingTimesheets,
      pendingJoinRequests,
      recentAuditLogs,
      totalPlayers,
      matchesThisWeek,
      trainingThisWeek,
    ] = await Promise.all([
      // Upcoming matches (next 7 days)
      prisma.match.findMany({
        where: {
          OR: [
            { homeClubId: { in: allClubIds } },
            { awayClubId: { in: allClubIds } },
          ],
          status: MatchStatus.SCHEDULED,
          kickOffTime: { gte: now, lte: next7Days },
          deletedAt: null,
        },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          homeClub: { select: { id: true, name: true, sport: true } },
        },
        orderBy: { kickOffTime: 'asc' },
        take: 10,
      }),

      // Upcoming training (next 7 days)
      prisma.trainingSession.findMany({
        where: {
          clubId: { in: allClubIds },
          status: TrainingStatus.SCHEDULED,
          startTime: { gte: now, lte: next7Days },
          deletedAt: null,
        },
        include: {
          team: { select: { name: true } },
          club: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'asc' },
        take: 10,
      }),

      // Pending timesheets
      prisma.coachTimesheet.count({
        where: {
          clubId: { in: allClubIds },
          status: TimesheetStatus.SUBMITTED,
        },
      }),

      // Pending join requests
      prisma.teamJoinRequest.count({
        where: {
          team: { clubId: { in: allClubIds } },
          status: 'PENDING',
        },
      }),

      // Recent audit logs
      prisma.auditLog.findMany({
        where: {
          resourceType: { in: ['CLUB', 'TEAM', 'MATCH', 'TRAINING_SESSION'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      // Total players across clubs
      prisma.teamPlayer.count({
        where: {
          team: { clubId: { in: allClubIds }, deletedAt: null },
          isActive: true,
        },
      }),

      // Matches this week
      prisma.match.count({
        where: {
          OR: [
            { homeClubId: { in: allClubIds } },
            { awayClubId: { in: allClubIds } },
          ],
          kickOffTime: { gte: weekStart, lt: weekEnd },
          deletedAt: null,
        },
      }),

      // Training this week
      prisma.trainingSession.count({
        where: {
          clubId: { in: allClubIds },
          startTime: { gte: weekStart, lt: weekEnd },
          deletedAt: null,
        },
      }),
    ]);

    // 8. Build club overviews
    const clubOverviews: ClubOverview[] = [
      ...ownedClubs.map((club) => ({
        id: club.id,
        name: club.name,
        logo: club.logo,
        sport: club.sport,
        role: 'OWNER' as const,
        teamCount: club._count.teams,
        memberCount: club._count.members,
        upcomingMatches: upcomingMatches.filter((m) => m.homeClub.id === club.id).length,
        upcomingTraining: upcomingTrainingSessions.filter((t) => t.club.id === club.id).length,
      })),
      ...memberClubs.map((membership) => ({
        id: membership.club.id,
        name: membership.club.name,
        logo: membership.club.logo,
        sport: membership.club.sport,
        role: membership.role,
        teamCount: membership.club._count.teams,
        memberCount: membership.club._count.members,
        upcomingMatches: upcomingMatches.filter((m) => m.homeClub.id === membership.club.id).length,
        upcomingTraining: upcomingTrainingSessions.filter((t) => t.club.id === membership.club.id).length,
      })),
    ];

    // 9. Transform upcoming matches
    const matchItems: UpcomingMatch[] = upcomingMatches.map((m) => ({
      id: m.id,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      kickOffTime: m.kickOffTime.toISOString(),
      venue: m.venue,
      clubId: m.homeClub.id,
      clubName: m.homeClub.name,
      sport: m.homeClub.sport,
    }));

    // 10. Transform upcoming training
    const trainingItems: UpcomingTraining[] = upcomingTrainingSessions.map((t) => ({
      id: t.id,
      name: t.name,
      teamName: t.team?.name || 'All Teams',
      startTime: t.startTime.toISOString(),
      location: t.location,
      attendanceCount: t.attendanceCount,
      clubId: t.club.id,
      clubName: t.club.name,
    }));

    // 11. Build pending items
    const pendingItems: PendingItem[] = [];

    if (pendingTimesheets > 0) {
      pendingItems.push({
        id: 'timesheets',
        type: 'TIMESHEET',
        title: `${pendingTimesheets} Pending Timesheet${pendingTimesheets > 1 ? 's' : ''}`,
        description: 'Coach timesheets awaiting approval',
        createdAt: now.toISOString(),
        clubId: '',
        priority: 'HIGH',
      });
    }

    if (pendingJoinRequests > 0) {
      pendingItems.push({
        id: 'join-requests',
        type: 'JOIN_REQUEST',
        title: `${pendingJoinRequests} Join Request${pendingJoinRequests > 1 ? 's' : ''}`,
        description: 'Players requesting to join teams',
        createdAt: now.toISOString(),
        clubId: '',
        priority: 'MEDIUM',
      });
    }

    // 12. Transform recent activity
    const recentActivity: RecentActivity[] = recentAuditLogs.map((log) => ({
      id: log.id,
      type: log.action,
      title: log.action.replace(/_/g, ' ').toLowerCase(),
      description: `${log.resourceType} ${log.resourceId}`,
      timestamp: log.createdAt.toISOString(),
      clubId: log.organisationId || '',
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
    }));

    // 13. Build stats
    const totalTeams = clubOverviews.reduce((sum, c) => sum + c.teamCount, 0);

    const stats: DashboardStats = {
      totalClubs: clubOverviews.length,
      totalTeams,
      totalPlayers,
      matchesThisWeek,
      trainingThisWeek,
      pendingApprovals: pendingTimesheets + pendingJoinRequests,
      attendanceRate: null, // Would need more complex calculation
    };

    // 14. Quick actions based on role
    const quickActions = [
      { label: 'Schedule Training', action: 'CREATE_TRAINING', icon: 'calendar', url: '/manager/training/new' },
      { label: 'Create Match', action: 'CREATE_MATCH', icon: 'trophy', url: '/manager/matches/new' },
      { label: 'Add Player', action: 'ADD_PLAYER', icon: 'user-plus', url: '/manager/players/add' },
      { label: 'View Reports', action: 'VIEW_REPORTS', icon: 'chart', url: '/manager/reports' },
    ];

    // 15. Build response
    const response: DashboardResponse = {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        roles: user.roles,
      },
      stats,
      clubs: clubOverviews,
      upcomingMatches: matchItems,
      upcomingTraining: trainingItems,
      pendingItems,
      recentActivity,
      quickActions,
    };

    const duration = performance.now() - startTime;

    return NextResponse.json(
      { success: true, data: response, requestId, timestamp: new Date().toISOString() },
      {
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${Math.round(duration)}ms`,
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Dashboard error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to load dashboard',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}