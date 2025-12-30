// ============================================================================
// 🏆 COACH DASHBOARD API - PitchConnect Enterprise v2.0.0
// ============================================================================
// GET /api/coach/dashboard - Comprehensive coach dashboard
// ============================================================================
// Schema: v7.7.0+ | Multi-Sport | RBAC | Audit Logging
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Sport, ClubMemberRole, MatchStatus } from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CoachDashboardResponse {
  coach: {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatar: string | null;
    bio: string | null;
    coachType: string;
    yearsExperience: number | null;
    specializations: string[];
    certifications: string[];
    qualifications: string[];
    hourlyRate: number | null;
    dailyRate: number | null;
    currency: string;
    isVerified: boolean;
    licenseNumber: string | null;
    licenseExpiry: string | null;
    overallRating: number | null;
    matchesManaged: number;
    winRate: number | null;
  };
  clubs: Array<{
    id: string;
    name: string;
    logo: string | null;
    sport: Sport;
    role: ClubMemberRole;
    joinedAt: string;
  }>;
  teams: Array<{
    id: string;
    name: string;
    clubId: string;
    clubName: string;
    sport: Sport;
    ageGroup: string | null;
    playerCount: number;
    upcomingMatches: number;
    upcomingTraining: number;
    role: string;
  }>;
  stats: {
    totalClubs: number;
    totalTeams: number;
    totalPlayers: number;
    totalMatches: number;
    upcomingMatches: number;
    upcomingTrainingSessions: number;
    pendingTimesheets: number;
    thisMonthHours: number;
  };
  recentMatches: Array<{
    id: string;
    kickOffTime: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: MatchStatus;
    venue: string | null;
    competition: string | null;
    sport: Sport;
  }>;
  upcomingMatches: Array<{
    id: string;
    kickOffTime: string;
    homeTeam: string;
    awayTeam: string;
    venue: string | null;
    competition: string | null;
    sport: Sport;
    status: MatchStatus;
  }>;
  trainingSessions: Array<{
    id: string;
    name: string;
    teamId: string;
    teamName: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    category: string;
    intensity: string;
    location: string | null;
    attendanceCount: number;
    status: string;
  }>;
  timesheets: {
    pending: number;
    submitted: number;
    approved: number;
    thisMonth: {
      totalHours: number;
      totalAmount: number;
      currency: string;
    };
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `coach-dash-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function calculateDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// ============================================================================
// GET /api/coach/dashboard
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          requestId 
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. GET USER WITH COACH PROFILE
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        coach: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'User not found' },
          requestId 
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (!user.coach) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'Coach profile not found - user is not registered as a coach' },
          requestId 
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    const coach = user.coach;

    // ========================================================================
    // 3. GET CLUB MEMBERSHIPS (Where user is a coach)
    // ========================================================================

    const clubMemberships = await prisma.clubMember.findMany({
      where: {
        userId: user.id,
        isActive: true,
        role: {
          in: ['HEAD_COACH', 'ASSISTANT_COACH', 'GOALKEEPER_COACH', 'PERFORMANCE_COACH'],
        },
        deletedAt: null,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
            sport: true,
            teams: {
              where: { deletedAt: null, status: 'ACTIVE' },
              include: {
                players: {
                  where: { isActive: true },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    // If no club memberships, return minimal response
    if (clubMemberships.length === 0) {
      const emptyResponse: CoachDashboardResponse = {
        coach: {
          id: coach.id,
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          avatar: user.avatar,
          bio: coach.bio,
          coachType: coach.coachType,
          yearsExperience: coach.yearsExperience,
          specializations: coach.specialization || [],
          certifications: coach.certifications || [],
          qualifications: coach.qualifications || [],
          hourlyRate: coach.hourlyRate,
          dailyRate: coach.dailyRate,
          currency: coach.currency,
          isVerified: coach.isVerified,
          licenseNumber: coach.licenseNumber,
          licenseExpiry: coach.licenseExpiry?.toISOString() || null,
          overallRating: coach.overallRating,
          matchesManaged: coach.matchesManaged,
          winRate: coach.winRate,
        },
        clubs: [],
        teams: [],
        stats: {
          totalClubs: 0,
          totalTeams: 0,
          totalPlayers: 0,
          totalMatches: 0,
          upcomingMatches: 0,
          upcomingTrainingSessions: 0,
          pendingTimesheets: 0,
          thisMonthHours: 0,
        },
        recentMatches: [],
        upcomingMatches: [],
        trainingSessions: [],
        timesheets: {
          pending: 0,
          submitted: 0,
          approved: 0,
          thisMonth: { totalHours: 0, totalAmount: 0, currency: 'GBP' },
        },
        notifications: [],
      };

      return NextResponse.json({
        success: true,
        data: emptyResponse,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      }, {
        status: 200,
        headers: { 'X-Request-ID': requestId, 'Cache-Control': 'private, max-age=60' },
      });
    }

    const clubIds = clubMemberships.map(m => m.club.id);
    const allTeams = clubMemberships.flatMap(m => m.club.teams);
    const teamIds = allTeams.map(t => t.id);

    // ========================================================================
    // 4. GET TRAINING SESSIONS (Coach's sessions)
    // ========================================================================

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const trainingSessions = await prisma.trainingSession.findMany({
      where: {
        coachId: coach.id,
        deletedAt: null,
        startTime: {
          gte: thirtyDaysAgo,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
        attendance: {
          where: { status: { in: ['PRESENT', 'LATE'] } },
          select: { id: true },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    });

    // ========================================================================
    // 5. GET MATCHES (For coach's teams)
    // ========================================================================

    const allMatches = await prisma.match.findMany({
      where: {
        deletedAt: null,
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
        kickOffTime: {
          gte: thirtyDaysAgo,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        homeClub: { select: { sport: true } },
        competition: { select: { name: true } },
      },
      orderBy: { kickOffTime: 'desc' },
      take: 20,
    });

    const recentMatches = allMatches
      .filter(m => new Date(m.kickOffTime) <= now)
      .slice(0, 5);

    const upcomingMatches = allMatches
      .filter(m => new Date(m.kickOffTime) > now && m.status === 'SCHEDULED')
      .slice(0, 5);

    // ========================================================================
    // 6. GET TIMESHEETS
    // ========================================================================

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const timesheets = await prisma.coachTimesheet.findMany({
      where: { coachId: coach.id },
      select: {
        id: true,
        status: true,
        totalHours: true,
        totalCost: true,
        currency: true,
        weekStartDate: true,
      },
    });

    const thisMonthTimesheets = timesheets.filter(
      ts => ts.weekStartDate >= monthStart && ts.weekStartDate <= monthEnd
    );

    const timesheetStats = {
      pending: timesheets.filter(ts => ts.status === 'DRAFT').length,
      submitted: timesheets.filter(ts => ts.status === 'SUBMITTED').length,
      approved: timesheets.filter(ts => ts.status === 'APPROVED').length,
      thisMonth: {
        totalHours: thisMonthTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0),
        totalAmount: thisMonthTimesheets.reduce((sum, ts) => sum + (ts.totalCost || 0), 0),
        currency: coach.currency || 'GBP',
      },
    };

    // ========================================================================
    // 7. GET NOTIFICATIONS
    // ========================================================================

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        read: true,
        createdAt: true,
      },
    });

    // ========================================================================
    // 8. CALCULATE AGGREGATE STATS
    // ========================================================================

    const totalPlayers = allTeams.reduce((sum, team) => sum + team.players.length, 0);
    const upcomingTrainingSessions = trainingSessions.filter(
      ts => new Date(ts.startTime) > now && ts.status !== 'CANCELLED'
    ).length;

    // ========================================================================
    // 9. BUILD RESPONSE
    // ========================================================================

    const response: CoachDashboardResponse = {
      coach: {
        id: coach.id,
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        avatar: user.avatar,
        bio: coach.bio,
        coachType: coach.coachType,
        yearsExperience: coach.yearsExperience,
        specializations: coach.specialization || [],
        certifications: coach.certifications || [],
        qualifications: coach.qualifications || [],
        hourlyRate: coach.hourlyRate,
        dailyRate: coach.dailyRate,
        currency: coach.currency,
        isVerified: coach.isVerified,
        licenseNumber: coach.licenseNumber,
        licenseExpiry: coach.licenseExpiry?.toISOString() || null,
        overallRating: coach.overallRating,
        matchesManaged: coach.matchesManaged,
        winRate: coach.winRate,
      },
      clubs: clubMemberships.map(m => ({
        id: m.club.id,
        name: m.club.name,
        logo: m.club.logo,
        sport: m.club.sport,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
      teams: allTeams.map(team => {
        const club = clubMemberships.find(m => m.club.teams.some(t => t.id === team.id))!.club;
        const membership = clubMemberships.find(m => m.clubId === club.id)!;
        const teamUpcomingMatches = upcomingMatches.filter(
          m => m.homeTeamId === team.id || m.awayTeamId === team.id
        ).length;
        const teamUpcomingTraining = trainingSessions.filter(
          ts => ts.teamId === team.id && new Date(ts.startTime) > now
        ).length;

        return {
          id: team.id,
          name: team.name,
          clubId: club.id,
          clubName: club.name,
          sport: club.sport,
          ageGroup: (team as any).ageGroup || null,
          playerCount: team.players.length,
          upcomingMatches: teamUpcomingMatches,
          upcomingTraining: teamUpcomingTraining,
          role: membership.role,
        };
      }),
      stats: {
        totalClubs: clubMemberships.length,
        totalTeams: allTeams.length,
        totalPlayers,
        totalMatches: allMatches.length,
        upcomingMatches: upcomingMatches.length,
        upcomingTrainingSessions,
        pendingTimesheets: timesheetStats.pending,
        thisMonthHours: timesheetStats.thisMonth.totalHours,
      },
      recentMatches: recentMatches.map(match => ({
        id: match.id,
        kickOffTime: match.kickOffTime.toISOString(),
        homeTeam: match.homeTeam?.name || 'TBD',
        awayTeam: match.awayTeam?.name || 'TBD',
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
        venue: match.venue,
        competition: match.competition?.name || null,
        sport: match.homeClub.sport,
      })),
      upcomingMatches: upcomingMatches.map(match => ({
        id: match.id,
        kickOffTime: match.kickOffTime.toISOString(),
        homeTeam: match.homeTeam?.name || 'TBD',
        awayTeam: match.awayTeam?.name || 'TBD',
        venue: match.venue,
        competition: match.competition?.name || null,
        sport: match.homeClub.sport,
        status: match.status,
      })),
      trainingSessions: trainingSessions.slice(0, 10).map(session => ({
        id: session.id,
        name: session.name,
        teamId: session.team?.id || '',
        teamName: session.team?.name || 'All Teams',
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        durationMinutes: calculateDuration(session.startTime, session.endTime),
        category: session.category,
        intensity: session.intensity,
        location: session.location,
        attendanceCount: session.attendance.length,
        status: session.status,
      })),
      timesheets: timesheetStats,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
    };

    console.log('[COACH_DASHBOARD]', { 
      requestId, 
      coachId: coach.id, 
      clubs: clubMemberships.length,
      teams: allTeams.length,
    });

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, {
      status: 200,
      headers: { 
        'X-Request-ID': requestId,
        'Cache-Control': 'private, max-age=60',
      },
    });

  } catch (error) {
    console.error('[COACH_DASHBOARD_ERROR]', { requestId, error });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load coach dashboard',
          details: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : String(error))
            : undefined,
        },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// HTTP OPTIONS (for CORS preflight)
// ============================================================================

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
