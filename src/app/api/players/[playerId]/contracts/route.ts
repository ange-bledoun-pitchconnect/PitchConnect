// =============================================================================
// 📋 PLAYER CONTRACTS API - Enterprise-Grade Implementation
// =============================================================================
// GET  /api/players/[playerId]/contracts - Get player's contracts/registrations
// POST /api/players/[playerId]/contracts - Create new contract (Admin/Manager)
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Model: PlayerContract
// Supports: Amateur registrations & Professional contracts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  Sport,
  Position,
  ContractStatus,
  ContractType,
  Prisma,
} from '@prisma/client';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface ContractItem {
  id: string;
  
  // Contract details
  contractType: ContractType;
  status: ContractStatus;
  position: Position | null;
  jerseyNumber: number | null;
  
  // Duration
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  daysRemaining: number | null;
  
  // Club/Team
  club: {
    id: string;
    name: string;
    logo: string | null;
    sport: Sport;
    type: string; // PROFESSIONAL, SEMI_PROFESSIONAL, AMATEUR
  };
  team: {
    id: string;
    name: string;
    ageGroup: string | null;
  } | null;
  
  // Financial (only if authorized)
  financial: {
    salary: number | null;
    currency: string;
    salaryPeriod: string | null; // WEEKLY, MONTHLY, YEARLY
    signingBonus: number | null;
    performanceBonus: number | null;
    releaseClause: number | null;
    agentFee: number | null;
  } | null;
  
  // Terms
  terms: {
    appearanceBonus: number | null;
    goalBonus: number | null;
    cleanSheetBonus: number | null;
    winBonus: number | null;
    hasImageRights: boolean;
    hasRelocationAllowance: boolean;
    notes: string | null;
  } | null;
  
  // Timestamps
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContractsResponse {
  player: {
    id: string;
    name: string;
  };
  
  contracts: ContractItem[];
  
  activeContract: ContractItem | null;
  
  summary: {
    totalContracts: number;
    activeContracts: number;
    expiredContracts: number;
    totalYearsContracted: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Roles that can view salary information
const FINANCIAL_VIEW_ROLES = ['SUPERADMIN', 'ADMIN', 'OWNER', 'MANAGER', 'TREASURER'];

// Roles that can create/edit contracts
const CONTRACT_MANAGE_ROLES = ['SUPERADMIN', 'ADMIN', 'OWNER', 'MANAGER'];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetContractsSchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  includeExpired: z.coerce.boolean().default(true),
});

const CreateContractSchema = z.object({
  // Required
  clubId: z.string().cuid(),
  startDate: z.string().datetime(),
  contractType: z.nativeEnum(ContractType),
  
  // Optional - team assignment
  teamId: z.string().cuid().optional(),
  position: z.nativeEnum(Position).optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
  
  // Contract duration
  endDate: z.string().datetime().optional(),
  
  // Financial (for professional contracts)
  salary: z.number().min(0).optional(),
  currency: z.string().length(3).default('GBP'),
  salaryPeriod: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  signingBonus: z.number().min(0).optional(),
  performanceBonus: z.number().min(0).optional(),
  releaseClause: z.number().min(0).optional(),
  agentFee: z.number().min(0).optional(),
  
  // Bonus terms
  appearanceBonus: z.number().min(0).optional(),
  goalBonus: z.number().min(0).optional(),
  cleanSheetBonus: z.number().min(0).optional(),
  winBonus: z.number().min(0).optional(),
  
  // Additional terms
  hasImageRights: z.boolean().default(false),
  hasRelocationAllowance: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `contract_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createResponse<T>(
  data: T | null,
  options: {
    success: boolean;
    error?: { code: string; message: string; details?: string };
    requestId: string;
    status?: number;
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: options.success,
    meta: {
      requestId: options.requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (options.success && data !== null) {
    response.data = data;
  }

  if (options.error) {
    response.error = options.error;
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      'X-Request-ID': options.requestId,
    },
  });
}

/**
 * Check user access to player contracts
 */
async function checkContractAccess(
  userId: string,
  playerId: string,
  action: 'view' | 'manage'
): Promise<{ 
  allowed: boolean; 
  canViewFinancial: boolean;
  canManage: boolean;
  isSelf: boolean;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSuperAdmin: true,
      roles: true,
      player: { select: { id: true } },
      clubMembers: {
        where: { isActive: true },
        select: { clubId: true, role: true },
      },
    },
  });

  if (!user) {
    return { allowed: false, canViewFinancial: false, canManage: false, isSelf: false, reason: 'User not found' };
  }

  const isSelf = user.player?.id === playerId;

  // Super admin has full access
  if (user.isSuperAdmin) {
    return { allowed: true, canViewFinancial: true, canManage: true, isSelf };
  }

  // Self can view but not manage
  if (isSelf) {
    return { allowed: true, canViewFinancial: true, canManage: false, isSelf };
  }

  // Get player's clubs
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      teamPlayers: {
        where: { isActive: true },
        select: { team: { select: { clubId: true } } },
      },
    },
  });

  const playerClubIds = player?.teamPlayers.map(tp => tp.team.clubId) || [];

  // Check club membership and role
  const relevantMembership = user.clubMembers.find(m => playerClubIds.includes(m.clubId));

  if (!relevantMembership) {
    // Admin roles can still view
    if (user.roles.some(r => ['ADMIN', 'SCOUT', 'ANALYST'].includes(r))) {
      return { 
        allowed: action === 'view', 
        canViewFinancial: user.roles.some(r => FINANCIAL_VIEW_ROLES.includes(r)),
        canManage: false,
        isSelf,
      };
    }
    return { allowed: false, canViewFinancial: false, canManage: false, isSelf, reason: 'Not in same club' };
  }

  const canViewFinancial = FINANCIAL_VIEW_ROLES.includes(relevantMembership.role);
  const canManage = CONTRACT_MANAGE_ROLES.includes(relevantMembership.role);

  if (action === 'manage' && !canManage) {
    return { allowed: false, canViewFinancial, canManage: false, isSelf, reason: 'Insufficient permissions' };
  }

  return { allowed: true, canViewFinancial, canManage, isSelf };
}

/**
 * Calculate days remaining in contract
 */
function calculateDaysRemaining(endDate: Date | null): number | null {
  if (!endDate) return null;
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// =============================================================================
// ROUTE CONTEXT
// =============================================================================

interface RouteContext {
  params: Promise<{ playerId: string }>;
}

// =============================================================================
// GET HANDLER - Get Player Contracts
// =============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;
    const { playerId } = await context.params;

    // 2. Check access
    const access = await checkContractAccess(userId, playerId, 'view');
    if (!access.allowed) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: access.reason || 'Access denied',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = GetContractsSchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid parameters',
        },
        requestId,
        status: 400,
      });
    }

    const filters = validation.data;

    // 4. Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Build contract query
    const contractWhere: Prisma.PlayerContractWhereInput = {
      playerId,
    };

    if (filters.status) {
      contractWhere.status = filters.status;
    }

    if (!filters.includeExpired) {
      contractWhere.status = { not: ContractStatus.EXPIRED };
    }

    // 6. Fetch contracts
    const contracts = await prisma.playerContract.findMany({
      where: contractWhere,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
            sport: true,
            type: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            ageGroup: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Active first
        { startDate: 'desc' },
      ],
    });

    // 7. Transform contracts
    const transformedContracts: ContractItem[] = contracts.map((contract) => {
      const now = new Date();
      const isActive = contract.status === ContractStatus.ACTIVE &&
        contract.startDate <= now &&
        (!contract.endDate || contract.endDate >= now);

      return {
        id: contract.id,
        
        contractType: contract.contractType,
        status: contract.status,
        position: contract.position,
        jerseyNumber: contract.jerseyNumber,
        
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate?.toISOString() || null,
        isActive,
        daysRemaining: calculateDaysRemaining(contract.endDate),
        
        club: {
          id: contract.club.id,
          name: contract.club.name,
          logo: contract.club.logo,
          sport: contract.club.sport,
          type: contract.club.type || 'AMATEUR',
        },
        team: contract.team ? {
          id: contract.team.id,
          name: contract.team.name,
          ageGroup: contract.team.ageGroup,
        } : null,
        
        // Financial info - only if authorized
        financial: access.canViewFinancial ? {
          salary: contract.salary,
          currency: contract.currency,
          salaryPeriod: contract.salaryPeriod,
          signingBonus: contract.signingBonus,
          performanceBonus: contract.performanceBonus,
          releaseClause: contract.releaseClause,
          agentFee: contract.agentFee,
        } : null,
        
        // Terms - only if authorized
        terms: access.canViewFinancial || access.isSelf ? {
          appearanceBonus: contract.appearanceBonus,
          goalBonus: contract.goalBonus,
          cleanSheetBonus: contract.cleanSheetBonus,
          winBonus: contract.winBonus,
          hasImageRights: contract.hasImageRights,
          hasRelocationAllowance: contract.hasRelocationAllowance,
          notes: contract.notes,
        } : null,
        
        signedAt: contract.signedAt?.toISOString() || null,
        createdAt: contract.createdAt.toISOString(),
        updatedAt: contract.updatedAt.toISOString(),
      };
    });

    // 8. Find active contract
    const activeContract = transformedContracts.find(c => c.isActive) || null;

    // 9. Calculate summary
    const summary = {
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === ContractStatus.ACTIVE).length,
      expiredContracts: contracts.filter(c => c.status === ContractStatus.EXPIRED).length,
      totalYearsContracted: contracts.reduce((total, c) => {
        if (!c.endDate) return total;
        const years = (c.endDate.getTime() - c.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return total + years;
      }, 0),
    };

    summary.totalYearsContracted = Math.round(summary.totalYearsContracted * 10) / 10;

    // 10. Build response
    const response: ContractsResponse = {
      player: {
        id: player.id,
        name: `${player.user.firstName} ${player.user.lastName}`,
      },
      contracts: transformedContracts,
      activeContract,
      summary,
    };

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Player contracts fetched`, {
      playerId,
      userId,
      contractCount: contracts.length,
      canViewFinancial: access.canViewFinancial,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/players/[id]/contracts error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch contracts',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// POST HANDLER - Create Contract
// =============================================================================

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
        requestId,
        status: 401,
      });
    }

    const userId = session.user.id;
    const { playerId } = await context.params;

    // 2. Check access
    const access = await checkContractAccess(userId, playerId, 'manage');
    if (!access.allowed || !access.canManage) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: access.reason || 'Only managers can create contracts',
        },
        requestId,
        status: 403,
      });
    }

    // 3. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid JSON in request body',
        },
        requestId,
        status: 400,
      });
    }

    const validation = CreateContractSchema.safeParse(body);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Validation failed',
        },
        requestId,
        status: 400,
      });
    }

    const data = validation.data;

    // 4. Verify player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Player not found',
        },
        requestId,
        status: 404,
      });
    }

    // 5. Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: data.clubId },
    });

    if (!club) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Club not found',
        },
        requestId,
        status: 400,
      });
    }

    // 6. Check for overlapping active contracts at same club
    const overlappingContract = await prisma.playerContract.findFirst({
      where: {
        playerId,
        clubId: data.clubId,
        status: ContractStatus.ACTIVE,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date(data.startDate) } },
        ],
      },
    });

    if (overlappingContract) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.CONFLICT,
          message: 'Player already has an active contract at this club',
        },
        requestId,
        status: 409,
      });
    }

    // 7. Create contract
    const contract = await prisma.playerContract.create({
      data: {
        playerId,
        clubId: data.clubId,
        teamId: data.teamId,
        contractType: data.contractType,
        status: ContractStatus.ACTIVE,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        
        // Financial
        salary: data.salary,
        currency: data.currency,
        salaryPeriod: data.salaryPeriod,
        signingBonus: data.signingBonus,
        performanceBonus: data.performanceBonus,
        releaseClause: data.releaseClause,
        agentFee: data.agentFee,
        
        // Bonuses
        appearanceBonus: data.appearanceBonus,
        goalBonus: data.goalBonus,
        cleanSheetBonus: data.cleanSheetBonus,
        winBonus: data.winBonus,
        
        // Terms
        hasImageRights: data.hasImageRights,
        hasRelocationAllowance: data.hasRelocationAllowance,
        notes: data.notes,
        
        signedAt: new Date(),
        createdBy: userId,
      },
      include: {
        club: { select: { name: true, sport: true } },
        team: { select: { name: true } },
      },
    });

    // 8. Create team player record if team specified
    if (data.teamId) {
      await prisma.teamPlayer.upsert({
        where: {
          playerId_teamId: {
            playerId,
            teamId: data.teamId,
          },
        },
        update: {
          isActive: true,
          position: data.position,
          jerseyNumber: data.jerseyNumber,
          joinedAt: new Date(data.startDate),
        },
        create: {
          playerId,
          teamId: data.teamId,
          role: 'PLAYER',
          position: data.position,
          jerseyNumber: data.jerseyNumber,
          joinedAt: new Date(data.startDate),
          isActive: true,
        },
      });
    }

    // 9. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CONTRACT_CREATED',
        resourceType: 'PLAYER_CONTRACT',
        resourceId: contract.id,
        afterState: {
          playerId,
          clubId: data.clubId,
          contractType: data.contractType,
          startDate: data.startDate,
          createdBy: userId,
        },
      },
    });

    const duration = performance.now() - startTime;

    console.log(`[${requestId}] Contract created`, {
      contractId: contract.id,
      playerId,
      clubId: data.clubId,
      type: data.contractType,
      userId,
      duration: `${Math.round(duration)}ms`,
    });

    return createResponse({
      id: contract.id,
      playerId,
      club: contract.club.name,
      team: contract.team?.name || null,
      contractType: contract.contractType,
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate?.toISOString() || null,
      createdAt: contract.createdAt.toISOString(),
    }, {
      success: true,
      requestId,
      status: 201,
    });
  } catch (error) {
    console.error(`[${requestId}] POST /api/players/[id]/contracts error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to create contract',
      },
      requestId,
      status: 500,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dynamic = 'force-dynamic';
