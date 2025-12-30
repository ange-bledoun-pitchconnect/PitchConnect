// ============================================================================
// 🧙 CLUB CREATION WIZARD API - PitchConnect Enterprise v2.0.0
// ============================================================================
// POST /api/clubs/create - Create club with optional first team (wizard flow)
// ============================================================================
// Schema: v7.7.0 | Multi-Sport: All 12 Sports | RBAC: Full
// ============================================================================
// 
// This wizard-style endpoint enables streamlined onboarding by allowing users
// to create a club AND optionally their first team in a single atomic operation.
// 
// Research-backed design:
// - Multi-step forms have 86% vs 66% completion (Formstack)
// - Immediate value delivery (user sees working club + team)
// - Atomic operations ensure data integrity
// - Mobile-first friendly (smaller payloads per step)
// 
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Sport, TeamType, TeamStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface WizardResponse {
  success: boolean;
  data?: {
    club: {
      id: string;
      name: string;
      slug: string;
      sport: Sport;
    };
    team?: {
      id: string;
      name: string;
      ageGroup: string | null;
    };
    membership: {
      clubMemberId: string;
      role: string;
    };
  };
  message?: string;
  nextSteps?: string[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    processingTimeMs: number;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SPORTS = [
  'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
  'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL'
] as const;

const TEAM_TYPES = [
  'PROFESSIONAL', 'SEMI_PROFESSIONAL', 'AMATEUR', 'ACADEMY',
  'YOUTH', 'RECREATIONAL', 'UNIVERSITY', 'SCHOOL'
] as const;

const AGE_GROUPS = [
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 
  'U15', 'U16', 'U17', 'U18', 'U19', 'U21', 'U23', 'SENIOR', 
  'VETERANS', 'MASTERS', 'MIXED'
] as const;

const firstTeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  ageGroup: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  sport: z.enum(SPORTS).optional(), // Can override club sport for multi-sport clubs
  minPlayers: z.number().min(1).max(100).optional(),
  maxPlayers: z.number().min(1).max(100).optional(),
});

const wizardSchema = z.object({
  // Club fields
  club: z.object({
    name: z.string().min(2, 'Club name must be at least 2 characters').max(100),
    shortName: z.string().max(20).optional(),
    description: z.string().max(2000).optional(),
    sport: z.enum(SPORTS),
    teamType: z.enum(TEAM_TYPES).default('AMATEUR'),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).default('United Kingdom'),
    address: z.string().max(500).optional(),
    postcode: z.string().max(20).optional(),
    foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
    website: z.string().url().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    logo: z.string().url().optional().or(z.literal('')),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    venue: z.string().max(200).optional(),
    venueCapacity: z.number().positive().optional(),
    isPublic: z.boolean().default(true),
    acceptingPlayers: z.boolean().default(true),
    acceptingStaff: z.boolean().default(true),
    organisationId: z.string().cuid().optional(),
  }),
  
  // Optional first team
  firstTeam: firstTeamSchema.optional(),
  
  // Wizard metadata
  wizardStep: z.number().optional(),
  skipTeamCreation: z.boolean().default(false),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `wizard-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + Date.now().toString(36);
}

function generateTeamCode(teamName: string, clubSlug: string): string {
  const words = teamName.trim().toUpperCase().split(/\s+/);
  const teamPart = words.map(w => w[0]).join('').substring(0, 4);
  const clubPart = clubSlug.substring(0, 3).toUpperCase();
  return `${clubPart}-${teamPart}`;
}

function getNextSteps(hasTeam: boolean): string[] {
  if (hasTeam) {
    return [
      'Invite players to your team via the team management page',
      'Set up your team formation and tactics',
      'Schedule your first training session',
      'Create a match or join a competition',
    ];
  }
  return [
    'Create your first team from the club dashboard',
    'Invite staff members to help manage your club',
    'Customize your club profile with logo and colors',
    'Explore competitions and leagues in your area',
  ];
}

// ============================================================================
// POST /api/clubs/create - Wizard Endpoint
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<WizardResponse>> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime }
        },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 2. Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        roles: true, 
        isSuperAdmin: true, 
        email: true, 
        firstName: true, 
        lastName: true 
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'User not found' },
          meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime }
        },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 3. Authorization
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER', 'LEAGUE_ADMIN', 'COACH', 'COACH_PRO'];
    const hasPermission = user.isSuperAdmin || user.roles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'You do not have permission to create clubs' },
          meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime }
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 4. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' },
          meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime }
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = wizardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input', 
            details: validation.error.flatten() 
          },
          meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime }
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { club: clubInput, firstTeam, skipTeamCreation } = validation.data;

    // 5. Check for duplicate club name
    const existingClub = await prisma.club.findFirst({
      where: {
        name: { equals: clubInput.name, mode: 'insensitive' },
        country: clubInput.country,
        deletedAt: null,
      },
    });

    if (existingClub) {
      return NextResponse.json(
        {
          success: false,
          error: { 
            code: 'CONFLICT', 
            message: `A club named "${clubInput.name}" already exists in ${clubInput.country}` 
          },
          meta: { requestId, timestamp: new Date().toISOString(), processingTimeMs: Date.now() - startTime }
        },
        { status: 409, headers: { 'X-Request-ID': requestId } }
      );
    }

    // 6. Generate identifiers
    const clubSlug = generateSlug(clubInput.name);
    const shouldCreateTeam = !skipTeamCreation && firstTeam?.name;

    // 7. Execute wizard transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create club
      const newClub = await tx.club.create({
        data: {
          name: clubInput.name,
          shortName: clubInput.shortName,
          slug: clubSlug,
          description: clubInput.description,
          sport: clubInput.sport as Sport,
          teamType: clubInput.teamType as TeamType,
          city: clubInput.city,
          state: clubInput.state,
          country: clubInput.country,
          address: clubInput.address,
          postcode: clubInput.postcode,
          foundedYear: clubInput.foundedYear,
          website: clubInput.website || null,
          email: clubInput.email || null,
          phone: clubInput.phone,
          logo: clubInput.logo || null,
          primaryColor: clubInput.primaryColor,
          secondaryColor: clubInput.secondaryColor,
          venue: clubInput.venue,
          venueCapacity: clubInput.venueCapacity,
          isPublic: clubInput.isPublic,
          acceptingPlayers: clubInput.acceptingPlayers,
          acceptingStaff: clubInput.acceptingStaff,
          organisationId: clubInput.organisationId,
          managerId: user.id,
          ownerId: user.id,
          status: 'ACTIVE',
        },
      });

      // Create club owner membership
      const clubMembership = await tx.clubMember.create({
        data: {
          userId: user.id,
          clubId: newClub.id,
          role: 'OWNER',
          isActive: true,
          joinedAt: new Date(),
          canManageRoster: true,
          canManageMatches: true,
          canManageBilling: true,
          canManageMedia: true,
          canCreateFriendlyMatches: true,
          canManageLineups: true,
        },
      });

      // Create first team if requested
      let newTeam = null;
      if (shouldCreateTeam && firstTeam) {
        // Team sport: use override if provided, otherwise inherit from club
        const teamSport = firstTeam.sport || clubInput.sport;
        
        newTeam = await tx.team.create({
          data: {
            clubId: newClub.id,
            name: firstTeam.name,
            description: firstTeam.description,
            ageGroup: firstTeam.ageGroup,
            gender: firstTeam.gender,
            status: 'ACTIVE' as TeamStatus,
            minPlayers: firstTeam.minPlayers,
            maxPlayers: firstTeam.maxPlayers,
            acceptingJoinRequests: true,
            requiresApproval: true,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CLUB_CREATED',
          resourceType: 'Club',
          resourceId: newClub.id,
          afterState: {
            id: newClub.id,
            name: newClub.name,
            sport: newClub.sport,
            country: newClub.country,
            teamCreated: newTeam ? { id: newTeam.id, name: newTeam.name } : null,
            wizardFlow: true,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          requestId,
        },
      });

      // If team was created, log that too
      if (newTeam) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'TEAM_CREATED',
            resourceType: 'Team',
            resourceId: newTeam.id,
            afterState: {
              id: newTeam.id,
              name: newTeam.name,
              clubId: newClub.id,
              wizardFlow: true,
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            requestId,
          },
        });
      }

      return { club: newClub, team: newTeam, membership: clubMembership };
    });

    console.log('[WIZARD_CLUB_CREATED]', { 
      requestId, 
      clubId: result.club.id, 
      clubName: result.club.name,
      teamId: result.team?.id,
      teamName: result.team?.name,
      userId: user.id 
    });

    // 8. Build response
    const response: WizardResponse = {
      success: true,
      data: {
        club: {
          id: result.club.id,
          name: result.club.name,
          slug: result.club.slug,
          sport: result.club.sport,
        },
        team: result.team ? {
          id: result.team.id,
          name: result.team.name,
          ageGroup: result.team.ageGroup,
        } : undefined,
        membership: {
          clubMemberId: result.membership.id,
          role: result.membership.role,
        },
      },
      message: result.team 
        ? `${result.club.name} and team ${result.team.name} created successfully!`
        : `${result.club.name} created successfully!`,
      nextSteps: getNextSteps(!!result.team),
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    };

    return NextResponse.json(response, { 
      status: 201, 
      headers: { 'X-Request-ID': requestId } 
    });

  } catch (error) {
    console.error('[WIZARD_CREATE_ERROR]', { requestId, error });
    
    return NextResponse.json(
      {
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to complete club creation wizard',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// GET /api/clubs/create - Get wizard configuration
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Return wizard configuration
    return NextResponse.json({
      success: true,
      data: {
        sports: SPORTS,
        teamTypes: TEAM_TYPES,
        ageGroups: AGE_GROUPS,
        genders: ['MALE', 'FEMALE', 'MIXED'],
        defaults: {
          country: 'United Kingdom',
          teamType: 'AMATEUR',
          isPublic: true,
          acceptingPlayers: true,
          acceptingStaff: true,
        },
        validation: {
          clubName: { min: 2, max: 100 },
          teamName: { min: 2, max: 100 },
          description: { max: 2000 },
        },
        steps: [
          { id: 1, name: 'Club Details', description: 'Basic club information' },
          { id: 2, name: 'Location', description: 'Where your club is based' },
          { id: 3, name: 'Branding', description: 'Logo and colors' },
          { id: 4, name: 'First Team', description: 'Optional - create your first team' },
        ],
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    }, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });

  } catch (error) {
    console.error('[WIZARD_CONFIG_ERROR]', { requestId, error });
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get wizard configuration' } },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
