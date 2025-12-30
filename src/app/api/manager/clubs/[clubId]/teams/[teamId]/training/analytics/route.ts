// =============================================================================
// 📊 TRAINING ANALYTICS API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/manager/clubs/[clubId]/teams/[teamId]/training/analytics
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Permission: Owner, Manager, Head Coach, Analyst
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClubMemberRole, AttendanceStatus, TrainingStatus, TrainingCategory, Sport } from '@prisma/client';

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

interface RouteParams {
  params: {
    clubId: string;
    teamId: string;
  };
}

type PeriodType = 'week' | 'month' | 'quarter' | 'season';

interface PlayerAttendanceStats {
  playerId: string;
  playerName: string;
  avatar: string | null;
  position: string | null;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  avgPerformanceRating: number | null;
  avgEffortRating: number | null;
  trend: 'improving' | 'declining' | 'stable';
  consecutivePresent: number;
}

interface CategoryStats {
  category: TrainingCategory;
  sessionCount: number;
  totalMinutes: number;
  avgAttendance: number;
  avgRating: number | null;
}

interface CoachStats {
  coachId: string;
  coachName: string;
  sessionsLed: number;
  totalMinutes: number;
  avgAttendance: number;
  avgSessionRating: number | null;
}

interface TrainingAnalyticsData {
  period: {
    type: PeriodType;
    startDate: string;
    endDate: string;
    label: string;
  };
  overview: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    upcomingSessions: number;
    totalTrainingMinutes: number;
    avgSessionDuration: number;
    avgAttendanceRate: number;
    avgSessionRating: number | null;
  };
  attendance: {
    overallRate: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    injuredCount: number;
    trend: number; // % change vs previous period
  };
  playerStats: PlayerAttendanceStats[];
  categoryBreakdown: CategoryStats[];
  coachPerformance: CoachStats[];
  weeklyTrends: Array<{
    week: string;
    sessions: number;
    attendanceRate: number;
    avgRating: number | null;
  }>;
  riskPlayers: Array<{
    playerId: string;
    playerName: string;
    attendanceRate: number;
    missedConsecutive: number;
    reason: string;
  }>;
  sportSpecificInsights: Record<string, unknown>;
}

// =============================================================================
// SPORT-SPECIFIC ANALYTICS CONFIGURATIONS
// =============================================================================

const SPORT_ANALYTICS_CONFIG: Record<Sport, { keyMetrics: string[]; benchmarks: Record<string, number> }> = {
  FOOTBALL: {
    keyMetrics: ['passing_drills', 'shooting_accuracy', 'tactical_sessions', 'set_piece_practice'],
    benchmarks: { minWeeklySessions: 3, targetAttendance: 85, minFitnessHours: 2 },
  },
  RUGBY: {
    keyMetrics: ['contact_sessions', 'lineout_drills', 'scrummaging', 'fitness_work'],
    benchmarks: { minWeeklySessions: 4, targetAttendance: 90, minContactHours: 3 },
  },
  BASKETBALL: {
    keyMetrics: ['shooting_drills', 'play_execution', 'conditioning', 'scrimmages'],
    benchmarks: { minWeeklySessions: 4, targetAttendance: 90, minShootingMinutes: 60 },
  },
  CRICKET: {
    keyMetrics: ['net_sessions', 'fielding_drills', 'match_simulation', 'fitness'],
    benchmarks: { minWeeklySessions: 3, targetAttendance: 85, minNetHours: 4 },
  },
  AMERICAN_FOOTBALL: {
    keyMetrics: ['position_drills', 'film_study', 'conditioning', 'team_practice'],
    benchmarks: { minWeeklySessions: 5, targetAttendance: 95, minFilmHours: 2 },
  },
  NETBALL: {
    keyMetrics: ['shooting_practice', 'footwork_drills', 'team_plays', 'fitness'],
    benchmarks: { minWeeklySessions: 3, targetAttendance: 85, minShootingMinutes: 45 },
  },
  HOCKEY: {
    keyMetrics: ['stick_skills', 'skating_drills', 'power_play', 'conditioning'],
    benchmarks: { minWeeklySessions: 4, targetAttendance: 90, minIceTime: 90 },
  },
  LACROSSE: {
    keyMetrics: ['stick_work', 'ground_balls', 'team_offense', 'conditioning'],
    benchmarks: { minWeeklySessions: 4, targetAttendance: 85, minStickMinutes: 30 },
  },
  AUSTRALIAN_RULES: {
    keyMetrics: ['kicking_drills', 'marking_practice', 'team_structure', 'fitness'],
    benchmarks: { minWeeklySessions: 4, targetAttendance: 90, minRunningKm: 8 },
  },
  GAELIC_FOOTBALL: {
    keyMetrics: ['skills_work', 'kickouts', 'team_plays', 'conditioning'],
    benchmarks: { minWeeklySessions: 3, targetAttendance: 85, minSkillsMinutes: 45 },
  },
  FUTSAL: {
    keyMetrics: ['ball_control', 'quick_passing', 'rotation_drills', 'fitness'],
    benchmarks: { minWeeklySessions: 3, targetAttendance: 90, minTouchMinutes: 30 },
  },
  BEACH_FOOTBALL: {
    keyMetrics: ['sand_movement', 'finishing', 'set_plays', 'conditioning'],
    benchmarks: { minWeeklySessions: 3, targetAttendance: 85, minSandMinutes: 60 },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const VIEW_ROLES: ClubMemberRole[] = [
  ClubMemberRole.OWNER,
  ClubMemberRole.MANAGER,
  ClubMemberRole.HEAD_COACH,
  ClubMemberRole.ASSISTANT_COACH,
  ClubMemberRole.ANALYST,
  ClubMemberRole.PERFORMANCE_COACH,
];

async function hasViewPermission(userId: string, clubId: string): Promise<boolean> {
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
      role: { in: VIEW_ROLES },
    },
  });

  return !!clubMember;
}

function getDateRange(period: PeriodType): { startDate: Date; endDate: Date; label: string } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      return { startDate, endDate, label: 'Last 7 Days' };
    case 'month':
      startDate.setDate(endDate.getDate() - 30);
      return { startDate, endDate, label: 'Last 30 Days' };
    case 'quarter':
      startDate.setDate(endDate.getDate() - 90);
      return { startDate, endDate, label: 'Last 90 Days' };
    case 'season':
      startDate.setMonth(endDate.getMonth() - 6);
      return { startDate, endDate, label: 'Last 6 Months' };
    default:
      startDate.setDate(endDate.getDate() - 30);
      return { startDate, endDate, label: 'Last 30 Days' };
  }
}

function calculateDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

function calculateTrend(current: number, previous: number): 'improving' | 'declining' | 'stable' {
  if (previous === 0) return 'stable';
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return 'improving';
  if (change < -5) return 'declining';
  return 'stable';
}

// =============================================================================
// GET HANDLER - Training Analytics
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();
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
    const hasPermission = await hasViewPermission(session.user.id, clubId);
    if (!hasPermission) {
      return createResponse(null, {
        success: false,
        error: 'You do not have permission to view training analytics',
        code: 'FORBIDDEN',
        requestId,
        status: 403,
      });
    }

    // 3. Verify team and get club sport
    const [team, club] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, clubId: true },
      }),
      prisma.club.findUnique({
        where: { id: clubId },
        select: { sport: true },
      }),
    ]);

    if (!team || team.clubId !== clubId) {
      return createResponse(null, {
        success: false,
        error: 'Team not found',
        code: 'NOT_FOUND',
        requestId,
        status: 404,
      });
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as PeriodType) || 'month';
    const { startDate, endDate, label } = getDateRange(period);

    // Previous period for trend calculation
    const prevStartDate = new Date(startDate);
    const periodDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);

    // 5. Fetch training sessions
    const [currentSessions, previousSessions] = await Promise.all([
      prisma.trainingSession.findMany({
        where: {
          teamId,
          deletedAt: null,
          startTime: { gte: startDate, lte: endDate },
        },
        include: {
          coach: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          attendance: {
            include: {
              player: {
                include: {
                  user: { select: { firstName: true, lastName: true, avatar: true } },
                },
              },
            },
          },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.trainingSession.count({
        where: {
          teamId,
          deletedAt: null,
          startTime: { gte: prevStartDate, lt: startDate },
        },
      }),
    ]);

    // 6. Calculate overview stats
    const completedSessions = currentSessions.filter((s) => s.status === TrainingStatus.COMPLETED);
    const cancelledSessions = currentSessions.filter((s) => s.status === TrainingStatus.CANCELLED);
    const upcomingSessions = currentSessions.filter(
      (s) => s.status === TrainingStatus.SCHEDULED && s.startTime > new Date()
    );

    const totalMinutes = completedSessions.reduce(
      (sum, s) => sum + calculateDurationMinutes(s.startTime, s.endTime),
      0
    );
    const avgDuration = completedSessions.length > 0 ? Math.round(totalMinutes / completedSessions.length) : 0;

    // 7. Calculate attendance stats
    let totalAttendanceRecords = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let injuredCount = 0;

    currentSessions.forEach((s) => {
      s.attendance.forEach((a) => {
        totalAttendanceRecords++;
        switch (a.status) {
          case AttendanceStatus.PRESENT:
            presentCount++;
            break;
          case AttendanceStatus.ABSENT:
            absentCount++;
            break;
          case AttendanceStatus.LATE:
            lateCount++;
            break;
          case AttendanceStatus.EXCUSED:
            excusedCount++;
            break;
          case AttendanceStatus.INJURED:
            injuredCount++;
            break;
        }
      });
    });

    const overallAttendanceRate = totalAttendanceRecords > 0
      ? Math.round(((presentCount + lateCount) / totalAttendanceRecords) * 100)
      : 0;

    // Previous period attendance for trend
    const prevAttendance = await prisma.trainingAttendance.count({
      where: {
        session: {
          teamId,
          startTime: { gte: prevStartDate, lt: startDate },
        },
        status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE] },
      },
    });

    const prevTotal = await prisma.trainingAttendance.count({
      where: {
        session: {
          teamId,
          startTime: { gte: prevStartDate, lt: startDate },
        },
      },
    });

    const prevAttendanceRate = prevTotal > 0 ? (prevAttendance / prevTotal) * 100 : 0;
    const attendanceTrend = overallAttendanceRate - prevAttendanceRate;

    // 8. Calculate player stats
    const playerMap = new Map<string, {
      playerId: string;
      name: string;
      avatar: string | null;
      position: string | null;
      sessions: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      performanceRatings: number[];
      effortRatings: number[];
      consecutivePresent: number;
    }>();

    currentSessions.forEach((s) => {
      s.attendance.forEach((a) => {
        const existing = playerMap.get(a.playerId) || {
          playerId: a.playerId,
          name: `${a.player.user.firstName} ${a.player.user.lastName}`,
          avatar: a.player.user.avatar,
          position: a.player.primaryPosition,
          sessions: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          performanceRatings: [],
          effortRatings: [],
          consecutivePresent: 0,
        };

        existing.sessions++;
        if (a.status === AttendanceStatus.PRESENT) existing.present++;
        if (a.status === AttendanceStatus.ABSENT) existing.absent++;
        if (a.status === AttendanceStatus.LATE) existing.late++;
        if (a.status === AttendanceStatus.EXCUSED) existing.excused++;
        if (a.performanceRating) existing.performanceRatings.push(a.performanceRating);
        if (a.effortRating) existing.effortRatings.push(a.effortRating);

        playerMap.set(a.playerId, existing);
      });
    });

    const playerStats: PlayerAttendanceStats[] = Array.from(playerMap.values())
      .map((p) => ({
        playerId: p.playerId,
        playerName: p.name,
        avatar: p.avatar,
        position: p.position,
        totalSessions: p.sessions,
        present: p.present,
        absent: p.absent,
        late: p.late,
        excused: p.excused,
        attendanceRate: p.sessions > 0 ? Math.round(((p.present + p.late) / p.sessions) * 100) : 0,
        avgPerformanceRating: p.performanceRatings.length > 0
          ? Math.round((p.performanceRatings.reduce((a, b) => a + b, 0) / p.performanceRatings.length) * 10) / 10
          : null,
        avgEffortRating: p.effortRatings.length > 0
          ? Math.round((p.effortRatings.reduce((a, b) => a + b, 0) / p.effortRatings.length) * 10) / 10
          : null,
        trend: calculateTrend(p.present, p.sessions - p.present),
        consecutivePresent: p.consecutivePresent,
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate);

    // 9. Calculate category breakdown
    const categoryMap = new Map<TrainingCategory, { sessions: number; minutes: number; attendance: number[]; ratings: number[] }>();

    currentSessions.forEach((s) => {
      const existing = categoryMap.get(s.category) || { sessions: 0, minutes: 0, attendance: [], ratings: [] };
      existing.sessions++;
      existing.minutes += calculateDurationMinutes(s.startTime, s.endTime);
      if (s.attendance.length > 0) {
        const presentRate = s.attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length / s.attendance.length;
        existing.attendance.push(presentRate * 100);
      }
      if (s.avgRating) existing.ratings.push(s.avgRating);
      categoryMap.set(s.category, existing);
    });

    const categoryBreakdown: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        sessionCount: data.sessions,
        totalMinutes: data.minutes,
        avgAttendance: data.attendance.length > 0
          ? Math.round(data.attendance.reduce((a, b) => a + b, 0) / data.attendance.length)
          : 0,
        avgRating: data.ratings.length > 0
          ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10
          : null,
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    // 10. Calculate coach performance
    const coachMap = new Map<string, { name: string; sessions: number; minutes: number; attendance: number[]; ratings: number[] }>();

    currentSessions.forEach((s) => {
      const coachName = `${s.coach.user.firstName} ${s.coach.user.lastName}`;
      const existing = coachMap.get(s.coachId) || { name: coachName, sessions: 0, minutes: 0, attendance: [], ratings: [] };
      existing.sessions++;
      existing.minutes += calculateDurationMinutes(s.startTime, s.endTime);
      if (s.attendance.length > 0) {
        const presentRate = s.attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length / s.attendance.length;
        existing.attendance.push(presentRate * 100);
      }
      if (s.avgRating) existing.ratings.push(s.avgRating);
      coachMap.set(s.coachId, existing);
    });

    const coachPerformance: CoachStats[] = Array.from(coachMap.entries())
      .map(([coachId, data]) => ({
        coachId,
        coachName: data.name,
        sessionsLed: data.sessions,
        totalMinutes: data.minutes,
        avgAttendance: data.attendance.length > 0
          ? Math.round(data.attendance.reduce((a, b) => a + b, 0) / data.attendance.length)
          : 0,
        avgSessionRating: data.ratings.length > 0
          ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10
          : null,
      }))
      .sort((a, b) => b.sessionsLed - a.sessionsLed);

    // 11. Calculate weekly trends
    const weekMap = new Map<string, { sessions: number; attendance: number[]; ratings: number[] }>();
    currentSessions.forEach((s) => {
      const weekStart = new Date(s.startTime);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weekMap.get(weekKey) || { sessions: 0, attendance: [], ratings: [] };
      existing.sessions++;
      if (s.attendance.length > 0) {
        const presentRate = s.attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length / s.attendance.length;
        existing.attendance.push(presentRate * 100);
      }
      if (s.avgRating) existing.ratings.push(s.avgRating);
      weekMap.set(weekKey, existing);
    });

    const weeklyTrends = Array.from(weekMap.entries())
      .map(([week, data]) => ({
        week,
        sessions: data.sessions,
        attendanceRate: data.attendance.length > 0
          ? Math.round(data.attendance.reduce((a, b) => a + b, 0) / data.attendance.length)
          : 0,
        avgRating: data.ratings.length > 0
          ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10
          : null,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // 12. Identify risk players (attendance < 70%)
    const riskPlayers = playerStats
      .filter((p) => p.attendanceRate < 70 && p.totalSessions >= 3)
      .map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        attendanceRate: p.attendanceRate,
        missedConsecutive: p.absent,
        reason: p.attendanceRate < 50 ? 'Critical attendance' : 'Low attendance',
      }))
      .slice(0, 10);

    // 13. Sport-specific insights
    const sportConfig = club?.sport ? SPORT_ANALYTICS_CONFIG[club.sport] : null;
    const sportSpecificInsights: Record<string, unknown> = {};

    if (sportConfig) {
      sportSpecificInsights.sport = club.sport;
      sportSpecificInsights.keyMetrics = sportConfig.keyMetrics;
      sportSpecificInsights.benchmarks = sportConfig.benchmarks;
      sportSpecificInsights.meetsBenchmarks = {
        weeklySessionTarget: currentSessions.length >= sportConfig.benchmarks.minWeeklySessions * (periodDays / 7),
        attendanceTarget: overallAttendanceRate >= sportConfig.benchmarks.targetAttendance,
      };
    }

    // 14. Calculate average session rating
    const sessionRatings = currentSessions
      .filter((s) => s.avgRating !== null)
      .map((s) => s.avgRating as number);
    const avgSessionRating = sessionRatings.length > 0
      ? Math.round((sessionRatings.reduce((a, b) => a + b, 0) / sessionRatings.length) * 10) / 10
      : null;

    // 15. Build response
    const response: TrainingAnalyticsData = {
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        label,
      },
      overview: {
        totalSessions: currentSessions.length,
        completedSessions: completedSessions.length,
        cancelledSessions: cancelledSessions.length,
        upcomingSessions: upcomingSessions.length,
        totalTrainingMinutes: totalMinutes,
        avgSessionDuration: avgDuration,
        avgAttendanceRate: overallAttendanceRate,
        avgSessionRating,
      },
      attendance: {
        overallRate: overallAttendanceRate,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        injuredCount,
        trend: Math.round(attendanceTrend * 10) / 10,
      },
      playerStats,
      categoryBreakdown,
      coachPerformance,
      weeklyTrends,
      riskPlayers,
      sportSpecificInsights,
    };

    const duration = performance.now() - startTime;

    return NextResponse.json(
      { success: true, data: response, requestId, timestamp: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Request-ID': requestId,
          'X-Response-Time': `${Math.round(duration)}ms`,
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Training Analytics error:`, error);
    return createResponse(null, {
      success: false,
      error: 'Failed to generate training analytics',
      code: 'INTERNAL_ERROR',
      requestId,
      status: 500,
    });
  }
}