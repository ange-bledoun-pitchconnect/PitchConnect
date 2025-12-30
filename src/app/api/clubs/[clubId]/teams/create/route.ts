// ============================================================================
// 🏆 TEAM CREATION API - PitchConnect Enterprise v2.0.0
// ============================================================================
// POST /api/clubs/[clubId]/teams/create - Create a new team within a club
// ============================================================================
// Schema: v7.7.0 | Multi-Sport: All 12 Sports | RBAC: Full
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { TeamStatus, FormationType } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SPORTS = [
  'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
  'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL'
] as const;

const AGE_GROUPS = [
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 
  'U15', 'U16', 'U17', 'U18', 'U19', 'U21', 'U23', 'SENIOR', 
  'VETERANS', 'MASTERS', 'MIXED', 'OPEN'
] as const;

const GENDERS = ['MALE', 'FEMALE', 'MIXED'] as const;

const TEAM_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED', 'DISSOLVED'] as const;

const FORMATIONS = [
  'FOUR_FOUR_TWO', 'FOUR_THREE_THREE', 'THREE_FIVE_TWO', 'FIVE_THREE_TWO',
  'FIVE_FOUR_ONE', 'THREE_FOUR_THREE', 'FOUR_TWO_THREE_ONE', 'FOUR_ONE_FOUR_ONE',
  'THREE_THREE_FOUR', 'FIVE_TWO_THREE', 'TWO_THREE_FIVE', 'FOUR_ONE_TWO_THREE',
  'FOUR_FOUR_ONE_ONE', 'FOUR_THREE_TWO_ONE', 'FOUR_FIVE_ONE',
  // Futsal
  'ONE_THREE_ONE', 'TWO_THREE', 'TWO_ONE_TWO', 'THREE_TWO', 'ONE_TWO_TWO',
  // American Football
  'I_FORMATION', 'SHOTGUN', 'PISTOL', 'SPREAD', 'SINGLE_BACK', 'PRO_SET', 'WILDCAT',
  // Netball
  'PODS', 'DIAMOND', 'FLAT_LINE',
  // Custom
  'CUSTOM'
] as const;

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  ageGroup: z.string().optional(),
  gender: z.enum(GENDERS).optional(),
  status: z.enum(TEAM_STATUSES).default('ACTIVE'),
  minPlayers: z.number().min(1).max(100).optional(),
  maxPlayers: z.number().min(1).max(100).optional(),
  defaultFormation: z.enum(FORMATIONS).optional(),
  acceptingJoinRequests: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `team-create-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// POST /api/clubs/[clubId]/teams/create
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { clubId } = params;

    // 2. Get club and verify exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { 
        id: true, 
        name: true, 
        slug: true, 
        sport: true, 
        ownerId: true,
        managerId: true,
        deletedAt: true,
        _count: {
          select: { teams: { where: { deletedAt: null } } },
        },
      },
    });

    if (!club || club.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Authorization - check membership
    const membership = await prisma.clubMember.findUnique({
      where: {
        userId_clubId: { userId: session.user.id, clubId },
      },
      select: { role: true, isActive: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuperAdmin: true },
    });

    const isOwner = session.user.id === club.ownerId;
    const isManager = session.user.id === club.managerId;
    const hasStaffRole = membership?.isActive && 
      ['OWNER', 'MANAGER', 'HEAD_COACH'].includes(membership.role);

    const canCreateTeam = isOwner || isManager || hasStaffRole || user?.isSuperAdmin;

    if (!canCreateTeam) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to create teams in this club' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() },
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // 5. Check for duplicate team name within club
    const existingTeam = await prisma.team.findFirst({
      where: {
        clubId,
        name: { equals: input.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CONFLICT', message: `A team named "${input.name}" already exists in this club` },
          requestId,
        },
        { status: 409, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Validate min/max players
    if (input.minPlayers && input.maxPlayers && input.minPlayers > input.maxPlayers) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Minimum players cannot exceed maximum players' },
          requestId,
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 7. Create team
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          clubId,
          name: input.name,
          description: input.description,
          logo: input.logo || null,
          ageGroup: input.ageGroup,
          gender: input.gender,
          status: input.status as TeamStatus,
          minPlayers: input.minPlayers,
          maxPlayers: input.maxPlayers,
          defaultFormation: input.defaultFormation as FormationType,
          acceptingJoinRequests: input.acceptingJoinRequests,
          requiresApproval: input.requiresApproval,
        },
        include: {
          club: {
            select: { id: true, name: true, sport: true },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'TEAM_CREATED',
          resourceType: 'Team',
          resourceId: newTeam.id,
          afterState: {
            id: newTeam.id,
            name: newTeam.name,
            clubId: newTeam.clubId,
            ageGroup: newTeam.ageGroup,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      return newTeam;
    });

    console.log('[TEAM_CREATED]', { 
      requestId, 
      teamId: team.id, 
      teamName: team.name, 
      clubId, 
      userId: session.user.id 
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: team.id,
          name: team.name,
          description: team.description,
          ageGroup: team.ageGroup,
          gender: team.gender,
          status: team.status,
          acceptingJoinRequests: team.acceptingJoinRequests,
          club: {
            id: team.club.id,
            name: team.club.name,
            sport: team.club.sport,
          },
          createdAt: team.createdAt.toISOString(),
        },
        message: 'Team created successfully',
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 201, headers: { 'X-Request-ID': requestId } }
    );

  } catch (error) {
    console.error('[TEAM_CREATE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create team' },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
