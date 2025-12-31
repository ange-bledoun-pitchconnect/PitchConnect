// =============================================================================
// 🏟️ TEAM API - PitchConnect v7.9.0
// =============================================================================
// Enterprise-grade team management: GET, PATCH, DELETE
// Multi-sport support | Full relations | Schema-aligned
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, Sport, TeamType, TeamStatus, Position, FormationType } from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RouteParams {
  params: { teamId: string };
}

interface TeamMemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  position: Position | null;
  jerseyNumber: number | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  status: string;
}

interface CoachSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  role: string;
  isPrimary: boolean;
}

interface MatchSummary {
  id: string;
  date: string;
  opponent: {
    id: string;
    name: string;
    logo: string | null;
  };
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  result: 'W' | 'D' | 'L' | 'PENDING';
  status: string;
  competition: string | null;
}

interface TeamDetailResponse {
  success: true;
  data: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
    description: string | null;
    logo: string | null;
    badge: string | null;
    type: TeamType;
    status: TeamStatus;
    sport: Sport;
    ageGroup: string | null;
    gender: string;
    colors: {
      primary: string | null;
      secondary: string | null;
    };
    formation: FormationType | null;
    homeVenueId: string | null;
    maxPlayers: number;
    activePlayers: number;
    registrationOpen: boolean;
    requiresApproval: boolean;
    inviteOnly: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    club: {
      id: string;
      name: string;
      shortName: string | null;
      logo: string | null;
      city: string | null;
      country: string | null;
      primaryColor: string | null;
      secondaryColor: string | null;
      manager: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
      owner: {
        id: string;
        firstName: string;
        lastName: string;
      } | null;
    };
    roster: {
      total: number;
      players: TeamMemberSummary[];
      captain: TeamMemberSummary | null;
      viceCaptain: TeamMemberSummary | null;
      byPosition: Record<string, number>;
    };
    staff: {
      total: number;
      coaches: CoachSummary[];
      headCoach: CoachSummary | null;
    };
    competitions: {
      id: string;
      name: string;
      type: string;
      group: string | null;
    }[];
    statistics: {
      matchesPlayed: number;
      wins: number;
      draws: number;
      losses: number;
      winRate: string;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      points: number;
      form: string[];
    };
    recentMatches: MatchSummary[];
    upcomingMatches: MatchSummary[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface UpdateTeamResponse {
  success: true;
  data: {
    id: string;
    name: string;
    description: string | null;
    logo: string | null;
    status: TeamStatus;
    updatedAt: string;
  };
  message: string;
  changedFields: string[];
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface DeleteTeamResponse {
  success: true;
  data: {
    id: string;
    name: string;
    archivedAt: string;
  };
  message: string;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const UpdateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  shortName: z.string().min(2).max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  logo: z.string().url().optional().nullable(),
  badge: z.string().url().optional().nullable(),
  status: z.nativeEnum(TeamStatus).optional(),
  ageGroup: z.string().max(50).optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  formation: z.nativeEnum(FormationType).optional().nullable(),
  maxPlayers: z.number().int().min(5).max(100).optional(),
  registrationOpen: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  inviteOnly: z.boolean().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
      meta: { timestamp: new Date().toISOString(), requestId },
    },
    { status, headers: { 'X-Request-ID': requestId } }
  );
}

function getMatchResult(
  teamId: string,
  match: any,
  isHome: boolean
): 'W' | 'D' | 'L' | 'PENDING' {
  if (match.status !== 'COMPLETED' || match.homeScore === null || match.awayScore === null) {
    return 'PENDING';
  }

  const teamScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;

  if (teamScore > opponentScore) return 'W';
  if (teamScore === opponentScore) return 'D';
  return 'L';
}

async function canManageTeam(
  userId: string,
  clubId: string,
  ownerId: string | null
): Promise<{ canManage: boolean; role: string | null }> {
  // Check if superadmin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'SUPERADMIN') {
    return { canManage: true, role: 'SUPERADMIN' };
  }

  // Check if club owner
  if (ownerId && userId === ownerId) {
    return { canManage: true, role: 'CLUB_OWNER' };
  }

  // Check club membership
  const membership = await prisma.clubMember.findFirst({
    where: {
      userId,
      clubId,
      isActive: true,
      role: { in: ['OWNER', 'MANAGER', 'HEAD_COACH'] },
    },
  });

  if (membership) {
    return { canManage: true, role: membership.role };
  }

  return { canManage: false, role: null };
}

// =============================================================================
// GET /api/teams/[teamId]
// Get complete team details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<TeamDetailResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { teamId } = params;

    // 2. Fetch team with comprehensive relations
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            city: true,
            country: true,
            primaryColor: true,
            secondaryColor: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        players: {
          where: { isActive: true },
          include: {
            player: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: [{ isCaptain: 'desc' }, { isViceCaptain: 'desc' }, { jerseyNumber: 'asc' }],
          take: 30,
        },
        coachAssignments: {
          where: { isActive: true },
          include: {
            coach: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { isPrimary: 'desc' },
          take: 10,
        },
        competitionTeams: {
          where: { isActive: true, isWithdrawn: false },
          include: {
            competition: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        homeMatches: {
          where: {
            deletedAt: null,
            status: { in: ['COMPLETED', 'SCHEDULED', 'IN_PROGRESS'] },
          },
          include: {
            awayTeam: {
              select: { id: true, name: true, logo: true },
            },
            competition: {
              select: { name: true },
            },
          },
          orderBy: { kickoff: 'desc' },
          take: 10,
        },
        awayMatches: {
          where: {
            deletedAt: null,
            status: { in: ['COMPLETED', 'SCHEDULED', 'IN_PROGRESS'] },
          },
          include: {
            homeTeam: {
              select: { id: true, name: true, logo: true },
            },
            competition: {
              select: { name: true },
            },
          },
          orderBy: { kickoff: 'desc' },
          take: 10,
        },
      },
    });

    if (!team) {
      return createErrorResponse('TEAM_NOT_FOUND', 'Team not found', requestId, 404);
    }

    // 3. Format roster
    const rosterPlayers: TeamMemberSummary[] = team.players.map((tp) => ({
      id: tp.player.id,
      firstName: tp.player.user.firstName,
      lastName: tp.player.user.lastName,
      fullName: `${tp.player.user.firstName} ${tp.player.user.lastName}`,
      avatar: tp.player.user.avatar,
      position: tp.position,
      jerseyNumber: tp.jerseyNumber,
      isCaptain: tp.isCaptain,
      isViceCaptain: tp.isViceCaptain,
      status: tp.status,
    }));

    const captain = rosterPlayers.find((p) => p.isCaptain) || null;
    const viceCaptain = rosterPlayers.find((p) => p.isViceCaptain) || null;

    // Count by position
    const byPosition: Record<string, number> = {};
    rosterPlayers.forEach((p) => {
      const pos = p.position || 'Unassigned';
      byPosition[pos] = (byPosition[pos] || 0) + 1;
    });

    // 4. Format staff
    const coaches: CoachSummary[] = team.coachAssignments.map((ca) => ({
      id: ca.coach.id,
      firstName: ca.coach.user.firstName,
      lastName: ca.coach.user.lastName,
      fullName: `${ca.coach.user.firstName} ${ca.coach.user.lastName}`,
      avatar: ca.coach.user.avatar,
      role: ca.role,
      isPrimary: ca.isPrimary,
    }));

    const headCoach = coaches.find((c) => c.role === 'HEAD_COACH' && c.isPrimary) || null;

    // 5. Format competitions
    const competitions = team.competitionTeams.map((ct) => ({
      id: ct.competition.id,
      name: ct.competition.name,
      type: ct.competition.type,
      group: ct.group,
    }));

    // 6. Process matches and calculate statistics
    const allMatches = [
      ...team.homeMatches.map((m) => ({ ...m, isHome: true })),
      ...team.awayMatches.map((m) => ({ ...m, isHome: false })),
    ].sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

    const completedMatches = allMatches.filter((m) => m.status === 'COMPLETED');
    const upcomingMatches = allMatches
      .filter((m) => m.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

    let wins = 0,
      draws = 0,
      losses = 0,
      goalsFor = 0,
      goalsAgainst = 0;
    const form: string[] = [];

    const recentMatches: MatchSummary[] = completedMatches.slice(0, 5).map((match) => {
      const opponent = match.isHome
        ? (match as any).awayTeam
        : (match as any).homeTeam;
      const result = getMatchResult(teamId, match, match.isHome);

      // Count stats
      if (result === 'W') wins++;
      else if (result === 'D') draws++;
      else if (result === 'L') losses++;

      const teamGoals = match.isHome ? match.homeScore : match.awayScore;
      const oppGoals = match.isHome ? match.awayScore : match.homeScore;
      goalsFor += teamGoals || 0;
      goalsAgainst += oppGoals || 0;
      form.push(result);

      return {
        id: match.id,
        date: match.kickoff.toISOString(),
        opponent: {
          id: opponent.id,
          name: opponent.name,
          logo: opponent.logo,
        },
        isHome: match.isHome,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        result,
        status: match.status,
        competition: (match as any).competition?.name || null,
      };
    });

    // Count remaining completed matches for stats
    completedMatches.slice(5).forEach((match) => {
      const result = getMatchResult(teamId, match, match.isHome);
      if (result === 'W') wins++;
      else if (result === 'D') draws++;
      else if (result === 'L') losses++;

      const teamGoals = match.isHome ? match.homeScore : match.awayScore;
      const oppGoals = match.isHome ? match.awayScore : match.homeScore;
      goalsFor += teamGoals || 0;
      goalsAgainst += oppGoals || 0;
    });

    const matchesPlayed = wins + draws + losses;
    const points = wins * 3 + draws;
    const winRate = matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(1) : '0.0';

    // 7. Format upcoming matches
    const formattedUpcoming: MatchSummary[] = upcomingMatches.slice(0, 5).map((match) => {
      const opponent = match.isHome
        ? (match as any).awayTeam
        : (match as any).homeTeam;

      return {
        id: match.id,
        date: match.kickoff.toISOString(),
        opponent: {
          id: opponent.id,
          name: opponent.name,
          logo: opponent.logo,
        },
        isHome: match.isHome,
        homeScore: null,
        awayScore: null,
        result: 'PENDING',
        status: match.status,
        competition: (match as any).competition?.name || null,
      };
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_VIEWED',
        resourceType: 'Team',
        resourceId: team.id,
        details: {
          teamName: team.name,
          sport: team.sport,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 9. Build response
    const response: TeamDetailResponse = {
      success: true,
      data: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        slug: team.slug,
        description: team.description,
        logo: team.logo,
        badge: team.badge,
        type: team.type,
        status: team.status,
        sport: team.sport,
        ageGroup: team.ageGroup,
        gender: team.gender,
        colors: {
          primary: team.primaryColor || team.club.primaryColor,
          secondary: team.secondaryColor || team.club.secondaryColor,
        },
        formation: team.formation,
        homeVenueId: team.homeVenueId,
        maxPlayers: team.maxPlayers,
        activePlayers: team.activePlayers,
        registrationOpen: team.registrationOpen,
        requiresApproval: team.requiresApproval,
        inviteOnly: team.inviteOnly,
        isActive: team.isActive,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
        club: team.club,
        roster: {
          total: rosterPlayers.length,
          players: rosterPlayers,
          captain,
          viceCaptain,
          byPosition,
        },
        staff: {
          total: coaches.length,
          coaches,
          headCoach,
        },
        competitions,
        statistics: {
          matchesPlayed,
          wins,
          draws,
          losses,
          winRate,
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          points,
          form: form.slice(0, 5),
        },
        recentMatches,
        upcomingMatches: formattedUpcoming,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/teams/[teamId] error:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch team details', requestId, 500);
  }
}

// =============================================================================
// PATCH /api/teams/[teamId]
// Update team information
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UpdateTeamResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { teamId } = params;

    // 2. Fetch current team
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        shortName: true,
        description: true,
        logo: true,
        badge: true,
        status: true,
        ageGroup: true,
        gender: true,
        formation: true,
        maxPlayers: true,
        registrationOpen: true,
        requiresApproval: true,
        inviteOnly: true,
        clubId: true,
        club: {
          select: {
            ownerId: true,
            managerId: true,
          },
        },
      },
    });

    if (!team) {
      return createErrorResponse('TEAM_NOT_FOUND', 'Team not found', requestId, 404);
    }

    // 3. Authorization
    const { canManage, role } = await canManageTeam(
      session.user.id,
      team.clubId,
      team.club.ownerId
    );

    if (!canManage) {
      return createErrorResponse(
        'FORBIDDEN',
        'You do not have permission to update this team',
        requestId,
        403
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateTeamSchema.parse(body);

    // 5. Track changes
    const changes: Record<string, { old: any; new: any }> = {};
    const updateData: Prisma.TeamUpdateInput = {};

    if (validatedData.name !== undefined && validatedData.name !== team.name) {
      changes.name = { old: team.name, new: validatedData.name };
      updateData.name = validatedData.name.trim();
    }

    if (validatedData.shortName !== undefined && validatedData.shortName !== team.shortName) {
      changes.shortName = { old: team.shortName, new: validatedData.shortName };
      updateData.shortName = validatedData.shortName?.trim() || null;
    }

    if (validatedData.description !== undefined && validatedData.description !== team.description) {
      changes.description = { old: '[REDACTED]', new: '[REDACTED]' };
      updateData.description = validatedData.description?.trim() || null;
    }

    if (validatedData.logo !== undefined && validatedData.logo !== team.logo) {
      changes.logo = { old: '[REDACTED]', new: '[REDACTED]' };
      updateData.logo = validatedData.logo || null;
    }

    if (validatedData.badge !== undefined && validatedData.badge !== team.badge) {
      changes.badge = { old: '[REDACTED]', new: '[REDACTED]' };
      updateData.badge = validatedData.badge || null;
    }

    if (validatedData.status !== undefined && validatedData.status !== team.status) {
      changes.status = { old: team.status, new: validatedData.status };
      updateData.status = validatedData.status;
    }

    if (validatedData.ageGroup !== undefined && validatedData.ageGroup !== team.ageGroup) {
      changes.ageGroup = { old: team.ageGroup, new: validatedData.ageGroup };
      updateData.ageGroup = validatedData.ageGroup?.trim() || null;
    }

    if (validatedData.gender !== undefined && validatedData.gender !== team.gender) {
      changes.gender = { old: team.gender, new: validatedData.gender };
      updateData.gender = validatedData.gender;
    }

    if (validatedData.formation !== undefined && validatedData.formation !== team.formation) {
      changes.formation = { old: team.formation, new: validatedData.formation };
      updateData.formation = validatedData.formation || null;
    }

    if (validatedData.maxPlayers !== undefined && validatedData.maxPlayers !== team.maxPlayers) {
      changes.maxPlayers = { old: team.maxPlayers, new: validatedData.maxPlayers };
      updateData.maxPlayers = validatedData.maxPlayers;
    }

    if (
      validatedData.registrationOpen !== undefined &&
      validatedData.registrationOpen !== team.registrationOpen
    ) {
      changes.registrationOpen = { old: team.registrationOpen, new: validatedData.registrationOpen };
      updateData.registrationOpen = validatedData.registrationOpen;
    }

    if (
      validatedData.requiresApproval !== undefined &&
      validatedData.requiresApproval !== team.requiresApproval
    ) {
      changes.requiresApproval = { old: team.requiresApproval, new: validatedData.requiresApproval };
      updateData.requiresApproval = validatedData.requiresApproval;
    }

    if (validatedData.inviteOnly !== undefined && validatedData.inviteOnly !== team.inviteOnly) {
      changes.inviteOnly = { old: team.inviteOnly, new: validatedData.inviteOnly };
      updateData.inviteOnly = validatedData.inviteOnly;
    }

    // 6. Check if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            id: team.id,
            name: team.name,
            description: team.description,
            logo: team.logo,
            status: team.status,
            updatedAt: new Date().toISOString(),
          },
          message: 'No changes provided',
          changedFields: [],
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        { status: 200, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 7. Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_UPDATED',
        resourceType: 'Team',
        resourceId: team.id,
        details: {
          teamName: team.name,
          changes,
          updatedBy: role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 9. Build response
    const response: UpdateTeamResponse = {
      success: true,
      data: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        logo: updatedTeam.logo,
        status: updatedTeam.status,
        updatedAt: updatedTeam.updatedAt.toISOString(),
      },
      message: `Team "${updatedTeam.name}" updated successfully`,
      changedFields: Object.keys(changes),
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] PATCH /api/teams/[teamId] error:`, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', requestId, 400, {
        errors: error.flatten().fieldErrors,
      });
    }

    return createErrorResponse('INTERNAL_ERROR', 'Failed to update team', requestId, 500);
  }
}

// =============================================================================
// DELETE /api/teams/[teamId]
// Archive team (soft delete)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<DeleteTeamResponse | ErrorResponse>> {
  const requestId = generateRequestId();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401);
    }

    const { teamId } = params;

    // 2. Fetch team
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        clubId: true,
        activePlayers: true,
        club: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!team) {
      return createErrorResponse('TEAM_NOT_FOUND', 'Team not found', requestId, 404);
    }

    // 3. Authorization - only club owners and superadmins can delete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isClubOwner = team.club.ownerId === session.user.id;

    if (!isSuperAdmin && !isClubOwner) {
      return createErrorResponse(
        'FORBIDDEN',
        'Only club owners and administrators can archive teams',
        requestId,
        403
      );
    }

    // 4. Check for active players
    if (team.activePlayers > 0) {
      // Optional: warn about active players
      console.warn(`[${requestId}] Archiving team with ${team.activePlayers} active players`);
    }

    // 5. Soft delete team
    const archivedTeam = await prisma.$transaction(async (tx) => {
      // Update team status and set deletedAt
      const updated = await tx.team.update({
        where: { id: teamId },
        data: {
          status: 'ARCHIVED',
          deletedAt: new Date(),
          isActive: false,
        },
      });

      // Deactivate all player associations
      await tx.teamPlayer.updateMany({
        where: { teamId },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      // Deactivate coach assignments
      await tx.coachAssignment.updateMany({
        where: { teamId },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });

      // Withdraw from competitions
      await tx.competitionTeam.updateMany({
        where: { teamId },
        data: {
          isWithdrawn: true,
          withdrawnAt: new Date(),
          withdrawReason: 'Team archived',
        },
      });

      return updated;
    });

    // 6. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_ARCHIVED',
        resourceType: 'Team',
        resourceId: team.id,
        details: {
          teamName: team.name,
          previousStatus: team.status,
          activePlayers: team.activePlayers,
          archivedBy: isSuperAdmin ? 'SUPERADMIN' : 'CLUB_OWNER',
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // 7. Build response
    const response: DeleteTeamResponse = {
      success: true,
      data: {
        id: archivedTeam.id,
        name: archivedTeam.name,
        archivedAt: archivedTeam.deletedAt?.toISOString() || new Date().toISOString(),
      },
      message: `Team "${team.name}" has been archived successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] DELETE /api/teams/[teamId] error:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to archive team', requestId, 500);
  }
}
