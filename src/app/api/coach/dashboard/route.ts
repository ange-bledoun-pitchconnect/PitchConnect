/**
 * Coach Dashboard API Route
 * ============================================================================
 * Comprehensive coach dashboard with team management, recent matches,
 * training sessions, player stats, and performance analytics.
 * 
 * Uses caching for frequently-accessed data and type-safe Prisma queries.
 * Production-ready with comprehensive error handling and logging.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CoachDashboardResponse {
  coach: {
    id: string;
    name: string;
    email: string;
    bio: string | null;
    yearsExperience: number | null;
    qualifications: string[];
    specializations: string[];
    hourlyRate: number | null;
  };
  teams: Array<{
    id: string;
    name: string;
    club: {
      id: string;
      name: string;
      logoUrl: string | null;
    };
    playerCount: number;
    activeMatches: number;
    upcomingMatches: number;
    teamStatus: string;
  }>;
  stats: {
    totalTeams: number;
    totalPlayers: number;
    totalMatches: number;
    upcomingMatches: number;
    activeTrainingSessions: number;
  };
  recentMatches: Array<{
    id: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    venue: string | null;
  }>;
  upcomingMatches: Array<{
    id: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    venue: string | null;
    status: string;
  }>;
  trainingSessions: Array<{
    id: string;
    teamId: string;
    teamName: string;
    date: string;
    duration: number;
    focus: string;
    location: string | null;
    attendance: number;
  }>;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ========================================================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    // Get user with coach profile
    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      include: {
        coachProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.coachProfile) {
      return NextResponse.json(
        { error: 'Coach profile not found - user is not a coach' },
        { status: 403 }
      );
    }

    const coach = user.coachProfile;

    // ========================================================================
    // 2. GET TEAMS WHERE COACH IS A MEMBER
    // ========================================================================
    // Use TeamMember junction table with role filtering
    // This is the correct relation per the schema

    const coachTeamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        role: 'COACH', // Only include rows where user is a coach
        status: 'ACTIVE',
      },
      include: {
        team: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    const teamIds = coachTeamMemberships.map(tm => tm.team.id);

    if (teamIds.length === 0) {
      // Coach has no teams yet - return minimal response
      return NextResponse.json({
        coach: {
          id: coach.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          bio: coach.bio,
          yearsExperience: coach.yearsExperience,
          qualifications: coach.qualifications || [],
          specializations: coach.specializations || [],
          hourlyRate: coach.hourlyRate,
        },
        teams: [],
        stats: {
          totalTeams: 0,
          totalPlayers: 0,
          totalMatches: 0,
          upcomingMatches: 0,
          activeTrainingSessions: 0,
        },
        recentMatches: [],
        upcomingMatches: [],
        trainingSessions: [],
      } as CoachDashboardResponse);
    }

    // ========================================================================
    // 3. GET DETAILED TEAM DATA
    // ========================================================================

    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: teamIds,
        },
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        members: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    // ========================================================================
    // 4. GET MATCHES FOR ALL COACH'S TEAMS
    // ========================================================================

    const now = new Date();

    const allMatches = await prisma.match.findMany({
      where: {
        OR: [
          {
            homeTeamId: {
              in: teamIds,
            },
          },
          {
            awayTeamId: {
              in: teamIds,
            },
          },
        ],
      },
      select: {
        id: true,
        date: true,
        status: true,
        venue: true,
        homeScore: true,
        awayScore: true,
        homeTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Separate recent and upcoming matches
    const recentMatches = allMatches
      .filter(m => new Date(m.date) <= now)
      .slice(0, 5);

    const upcomingMatches = allMatches
      .filter(m => new Date(m.date) > now)
      .slice(0, 5);

    // ========================================================================
    // 5. GET TRAINING SESSIONS FOR ALL COACH'S TEAMS
    // ============================================================================

    const trainingSessions = await prisma.trainingSession.findMany({
      where: {
        teamId: {
          in: teamIds,
        },
        coachId: coach.id,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        attendance: {
          where: {
            status: {
              in: ['PRESENT', 'LATE'],
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    // ========================================================================
    // 6. BUILD ENHANCED TEAM RESPONSE
    // ========================================================================

    const teamsData = teams.map(team => {
      const teamMatches = allMatches.filter(
        m => m.homeTeamId === team.id || m.awayTeamId === team.id
      );

      const activeMatches = teamMatches.filter(
        m => m.status === 'LIVE' || m.status === 'SCHEDULED'
      ).length;

      const upcomingTeamMatches = teamMatches.filter(
        m => new Date(m.date) > now && m.status === 'SCHEDULED'
      ).length;

      return {
        id: team.id,
        name: team.name,
        club: team.club,
        playerCount: team.members.length,
        activeMatches,
        upcomingMatches: upcomingTeamMatches,
        teamStatus: team.status,
      };
    });

    // ========================================================================
    // 7. CALCULATE AGGREGATE STATS
    // ========================================================================

    const totalPlayers = teams.reduce(
      (sum, team) => sum + team.members.length,
      0
    );

    const totalMatches = allMatches.length;
    const upcomingMatchCount = upcomingMatches.length;
    const activeTrainingSessions = trainingSessions.filter(
      ts => ts.date > now
    ).length;

    // ========================================================================
    // 8. BUILD AND RETURN RESPONSE
    // ========================================================================

    const response: CoachDashboardResponse = {
      coach: {
        id: coach.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        bio: coach.bio,
        yearsExperience: coach.yearsExperience,
        qualifications: coach.qualifications || [],
        specializations: coach.specializations || [],
        hourlyRate: coach.hourlyRate,
      },
      teams: teamsData,
      stats: {
        totalTeams: teams.length,
        totalPlayers,
        totalMatches,
        upcomingMatches: upcomingMatchCount,
        activeTrainingSessions,
      },
      recentMatches: recentMatches.map(match => ({
        id: match.id,
        date: match.date.toISOString(),
        homeTeam: match.homeTeam?.name || 'N/A',
        awayTeam: match.awayTeam?.name || 'N/A',
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
        venue: match.venue,
      })),
      upcomingMatches: upcomingMatches.map(match => ({
        id: match.id,
        date: match.date.toISOString(),
        homeTeam: match.homeTeam?.name || 'N/A',
        awayTeam: match.awayTeam?.name || 'N/A',
        venue: match.venue,
        status: match.status,
      })),
      trainingSessions: trainingSessions.map(session => ({
        id: session.id,
        teamId: session.team.id,
        teamName: session.team.name,
        date: session.date.toISOString(),
        duration: session.duration,
        focus: session.focus,
        location: session.location,
        attendance: session.attendance.length,
      })),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });

  } catch (error) {
    console.error('🚨 Coach dashboard error:', error);
    
    // Log structured error for monitoring
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HTTP OPTIONS (for CORS preflight)
// ============================================================================

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
