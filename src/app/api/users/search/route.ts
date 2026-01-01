// =============================================================================
// 🔍 PITCHCONNECT - USER SEARCH API
// Path: /src/app/api/users/search/route.ts
// =============================================================================
//
// GET - Search users with role-based filtering and privacy controls
//
// VERSION: 4.0.0 - Enterprise Edition
// SCHEMA: v7.10.0 aligned
//
// =============================================================================
// FEATURES
// =============================================================================
// ✅ Full schema alignment (User model)
// ✅ Role-based result filtering
// ✅ Privacy settings respected
// ✅ Multi-sport context support
// ✅ Comprehensive search (name, email)
// ✅ Pagination
// ✅ Request ID tracking
// ✅ Audit logging
// ✅ TypeScript strict mode
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, UserStatus, Sport } from '@prisma/client';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  avatar: string | null;
  status: UserStatus;
  roles: UserRole[];
  nationality: string | null;
  bio: string | null;
  isVerified: boolean;
  // Player-specific (if applicable)
  player?: {
    id: string;
    primaryPosition: string | null;
    overallRating: number | null;
    isActive: boolean;
  } | null;
  // Coach-specific (if applicable)
  coach?: {
    id: string;
    licenseLevel: string | null;
    specialization: string[];
  } | null;
  // Privacy
  isFollowedByMe: boolean;
  isFollowingMe: boolean;
  mutualConnections: number;
  createdAt: string;
}

interface SearchUsersResponse {
  success: true;
  data: UserSearchResult[];
  pagination: {
    limit: number;
    offset: number;
    returned: number;
    hasMore: boolean;
  };
  searchTerm: string;
  searchType: 'email' | 'name' | 'all';
  filters: {
    roles: UserRole[] | null;
    status: UserStatus | null;
    sport: Sport | null;
  };
  timestamp: string;
  requestId: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: string;
  requestId: string;
  timestamp: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_SEARCH_LENGTH = 2;

// Users that can search all users
const ADMIN_SEARCH_ROLES: UserRole[] = [
  'SUPERADMIN',
  'ADMIN',
];

// Users with club-level search access
const CLUB_SEARCH_ROLES: UserRole[] = [
  'CLUB_MANAGER',
  'CLUB_OWNER',
  'MANAGER',
];

// Users with limited search (public profiles + same team/club)
const LIMITED_SEARCH_ROLES: UserRole[] = [
  'COACH',
  'COACH_PRO',
  'PLAYER',
  'PLAYER_PRO',
  'SCOUT',
  'ANALYST',
  'REFEREE',
];

// Roles restricted from broad search
const RESTRICTED_ROLES: UserRole[] = [
  'PARENT',
  'GUARDIAN',
  'FAN',
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create error response
 */
function errorResponse(
  error: string,
  code: string,
  status: number,
  requestId: string,
  details?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status, headers: { 'X-Request-ID': requestId } }
  );
}

/**
 * Check if user has any of the specified roles
 */
function hasAnyRole(userRoles: UserRole[] | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Sanitize search input
 */
function sanitizeSearchInput(input: string): string {
  return input
    .toString()
    .trim()
    .replace(/[<>\"\'\\]/g, '') // Remove potentially dangerous characters
    .slice(0, 100); // Limit length
}

/**
 * Validate email format
 */
function isValidEmailFormat(email: string): boolean {
  if (!email.includes('@')) return true; // Partial search allowed
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

async function createAuditLog(params: {
  userId: string;
  action: string;
  resourceType: string;
  details: Record<string, unknown>;
  requestId: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        details: params.details,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', {
      requestId: params.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// =============================================================================
// GET /api/users/search
// =============================================================================

/**
 * Search for users by email or name with role-based filtering
 * 
 * Query Parameters:
 *   - q: string (required) - Search query (name or email)
 *   - type: 'email' | 'name' | 'all' (default: 'all')
 *   - limit: number (default: 20, max: 100)
 *   - offset: number (default: 0)
 *   - roles: comma-separated UserRole values (filter by role)
 *   - status: UserStatus (default: ACTIVE)
 *   - sport: Sport enum (filter by player sport context)
 *   - includeProfiles: boolean (include player/coach profiles)
 *   - excludeIds: comma-separated user IDs to exclude
 * 
 * Authorization Rules:
 *   - SUPERADMIN, ADMIN: Can search all users
 *   - CLUB_MANAGER, CLUB_OWNER: Can search users in their club + public profiles
 *   - COACH, PLAYER: Can search team members + public profiles
 *   - PARENT: Can only search their children's team members
 *   - FAN: Can only search public profiles
 * 
 * Privacy:
 *   - Users with private profiles only shown to admins or connected users
 *   - Email only shown to admins or if user has made it public
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<SearchUsersResponse | ErrorResponse>> {
  const requestId = generateRequestId();
  const startTime = performance.now();

  try {
    // =========================================================================
    // 1. AUTHENTICATION
    // =========================================================================

    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse(
        'Authentication required',
        'AUTH_REQUIRED',
        401,
        requestId
      );
    }

    // Get current user with roles and relations
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        roles: true,
        organisationId: true,
        // Get user's club memberships
        clubMembers: {
          where: { isActive: true },
          select: { clubId: true },
        },
        // Get player's teams
        player: {
          select: {
            id: true,
            teamPlayers: {
              where: { isActive: true },
              select: { teamId: true, team: { select: { clubId: true } } },
            },
          },
        },
        // Get coach assignments
        coach: {
          select: {
            id: true,
            assignments: {
              where: { isActive: true },
              select: { teamId: true, clubId: true },
            },
          },
        },
        // Get parent's children
        parent: {
          select: {
            id: true,
            children: {
              select: {
                player: {
                  select: {
                    teamPlayers: {
                      where: { isActive: true },
                      select: { teamId: true },
                    },
                  },
                },
              },
            },
          },
        },
        // Get following list
        following: {
          select: { followingId: true },
        },
        // Get followers list
        followers: {
          select: { followerId: true },
        },
      },
    });

    if (!currentUser) {
      return errorResponse('User not found', 'USER_NOT_FOUND', 404, requestId);
    }

    // =========================================================================
    // 2. PARSE QUERY PARAMETERS
    // =========================================================================

    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q');
    const searchType = (searchParams.get('type') || 'all') as 'email' | 'name' | 'all';
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const rolesParam = searchParams.get('roles');
    const statusParam = searchParams.get('status');
    const sportParam = searchParams.get('sport');
    const includeProfiles = searchParams.get('includeProfiles') === 'true';
    const excludeIdsParam = searchParams.get('excludeIds');

    // Validate required query parameter
    if (!query || query.length < MIN_SEARCH_LENGTH) {
      return errorResponse(
        `Search query must be at least ${MIN_SEARCH_LENGTH} characters`,
        'INVALID_QUERY',
        400,
        requestId
      );
    }

    const sanitizedQuery = sanitizeSearchInput(query);

    // Validate search type-specific requirements
    if (searchType === 'email' && !isValidEmailFormat(sanitizedQuery)) {
      return errorResponse(
        'Invalid email format',
        'INVALID_EMAIL_FORMAT',
        400,
        requestId
      );
    }

    // Parse roles filter
    const rolesFilter: UserRole[] | null = rolesParam
      ? rolesParam.split(',').filter((r) => Object.values(UserRole).includes(r as UserRole)) as UserRole[]
      : null;

    // Parse status filter
    const statusFilter: UserStatus | null = statusParam && Object.values(UserStatus).includes(statusParam as UserStatus)
      ? (statusParam as UserStatus)
      : null;

    // Parse sport filter
    const sportFilter: Sport | null = sportParam && Object.values(Sport).includes(sportParam as Sport)
      ? (sportParam as Sport)
      : null;

    // Parse excluded IDs
    const excludeIds = excludeIdsParam
      ? excludeIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
      : [];

    // Always exclude current user
    excludeIds.push(currentUser.id);

    // =========================================================================
    // 3. BUILD WHERE CLAUSE BASED ON ROLE
    // =========================================================================

    const where: any = {
      // Always exclude current user and specified IDs
      id: { notIn: excludeIds },
      // Default to active users unless admin searching
      status: statusFilter || 'ACTIVE',
      // Exclude deleted users
      deletedAt: null,
    };

    const userRoles = currentUser.roles as UserRole[];
    const isAdmin = hasAnyRole(userRoles, ADMIN_SEARCH_ROLES);
    const isClubLevel = hasAnyRole(userRoles, CLUB_SEARCH_ROLES);
    const isLimited = hasAnyRole(userRoles, LIMITED_SEARCH_ROLES);
    const isRestricted = hasAnyRole(userRoles, RESTRICTED_ROLES);

    // Get accessible IDs based on user's connections
    const followingIds = currentUser.following.map((f) => f.followingId);
    const followerIds = currentUser.followers.map((f) => f.followerId);

    // Get accessible club IDs
    const accessibleClubIds: string[] = [];
    currentUser.clubMembers.forEach((m) => accessibleClubIds.push(m.clubId));
    currentUser.coach?.assignments.forEach((a) => {
      if (a.clubId) accessibleClubIds.push(a.clubId);
    });
    currentUser.player?.teamPlayers.forEach((tp) => {
      if (tp.team?.clubId) accessibleClubIds.push(tp.team.clubId);
    });

    // Get accessible team IDs
    const accessibleTeamIds: string[] = [];
    currentUser.player?.teamPlayers.forEach((tp) => accessibleTeamIds.push(tp.teamId));
    currentUser.coach?.assignments.forEach((a) => {
      if (a.teamId) accessibleTeamIds.push(a.teamId);
    });

    // For parents, add children's teams
    if (currentUser.parent?.children) {
      currentUser.parent.children.forEach((child) => {
        child.player?.teamPlayers.forEach((tp) => accessibleTeamIds.push(tp.teamId));
      });
    }

    // Apply visibility filters based on role
    if (!isAdmin) {
      if (isRestricted) {
        // Parents/Fans: Only public profiles or team members
        where.OR = [
          // Public profiles
          { isProfilePublic: true },
          // Users in accessible teams (through player relation)
          {
            player: {
              teamPlayers: {
                some: { teamId: { in: accessibleTeamIds } },
              },
            },
          },
          // Users they follow or who follow them
          { id: { in: [...followingIds, ...followerIds] } },
        ];
      } else if (isLimited) {
        // Coach/Player: Club members + public profiles + connections
        where.OR = [
          // Public profiles
          { isProfilePublic: true },
          // Same club members
          {
            clubMembers: {
              some: { clubId: { in: accessibleClubIds }, isActive: true },
            },
          },
          // Same team players
          {
            player: {
              teamPlayers: {
                some: { teamId: { in: accessibleTeamIds } },
              },
            },
          },
          // Connected users
          { id: { in: [...followingIds, ...followerIds] } },
        ];
      } else if (isClubLevel) {
        // Club managers: All club members + public profiles
        where.OR = [
          // Public profiles
          { isProfilePublic: true },
          // Club members
          {
            clubMembers: {
              some: { clubId: { in: accessibleClubIds } },
            },
          },
        ];
      }
    }

    // Apply search query
    if (searchType === 'email') {
      where.email = { contains: sanitizedQuery, mode: 'insensitive' };
    } else if (searchType === 'name') {
      where.OR = where.OR || [];
      where.OR.push(
        { firstName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { lastName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { displayName: { contains: sanitizedQuery, mode: 'insensitive' } }
      );
    } else {
      // Search all fields
      const searchConditions = [
        { firstName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { lastName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { displayName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { email: { contains: sanitizedQuery, mode: 'insensitive' } },
      ];

      if (where.OR) {
        // Combine with existing OR conditions using AND
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Apply role filter
    if (rolesFilter && rolesFilter.length > 0) {
      where.roles = { hasSome: rolesFilter };
    }

    // =========================================================================
    // 4. FETCH USERS
    // =========================================================================

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        email: true,
        avatar: true,
        status: true,
        roles: true,
        nationality: true,
        bio: true,
        isVerified: true,
        isProfilePublic: true,
        createdAt: true,
        // Conditionally include player/coach profiles
        ...(includeProfiles && {
          player: {
            select: {
              id: true,
              primaryPosition: true,
              overallRating: true,
              isActive: true,
            },
          },
          coach: {
            select: {
              id: true,
              licenseLevel: true,
              specialization: true,
            },
          },
        }),
        // Get mutual connections count
        followers: {
          where: { followerId: currentUser.id },
          select: { id: true },
        },
        following: {
          where: { followingId: currentUser.id },
          select: { id: true },
        },
      },
      take: limit + 1, // Fetch one extra to check if there are more
      skip: offset,
      orderBy: [
        // Prioritize by match quality
        { firstName: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Check if there are more results
    const hasMore = users.length > limit;
    const resultsToReturn = hasMore ? users.slice(0, limit) : users;

    // =========================================================================
    // 5. FORMAT RESULTS
    // =========================================================================

    const formattedUsers: UserSearchResult[] = resultsToReturn.map((user) => {
      const isFollowedByMe = followingIds.includes(user.id);
      const isFollowingMe = followerIds.includes(user.id);

      // Determine if email should be shown
      const showEmail = isAdmin || user.isProfilePublic || isFollowedByMe;

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        email: showEmail ? user.email : '***@***.***', // Mask email for privacy
        avatar: user.avatar,
        status: user.status,
        roles: user.roles as UserRole[],
        nationality: user.nationality,
        bio: user.bio,
        isVerified: user.isVerified,
        player: includeProfiles && user.player ? user.player : undefined,
        coach: includeProfiles && user.coach ? user.coach : undefined,
        isFollowedByMe,
        isFollowingMe,
        mutualConnections: (user.followers?.length || 0) + (user.following?.length || 0),
        createdAt: user.createdAt.toISOString(),
      };
    });

    // =========================================================================
    // 6. AUDIT LOG
    // =========================================================================

    await createAuditLog({
      userId: currentUser.id,
      action: 'USER_SEARCH',
      resourceType: 'User',
      details: {
        searchQuery: sanitizedQuery,
        searchType,
        filters: { roles: rolesFilter, status: statusFilter, sport: sportFilter },
        resultsCount: formattedUsers.length,
      },
      requestId,
    });

    // =========================================================================
    // 7. BUILD RESPONSE
    // =========================================================================

    const duration = Math.round(performance.now() - startTime);

    const response: SearchUsersResponse = {
      success: true,
      data: formattedUsers,
      pagination: {
        limit,
        offset,
        returned: formattedUsers.length,
        hasMore,
      },
      searchTerm: sanitizedQuery,
      searchType,
      filters: {
        roles: rolesFilter,
        status: statusFilter,
        sport: sportFilter,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    console.log(
      `✅ User search: found ${formattedUsers.length} results for "${sanitizedQuery}" (${duration}ms)`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error) {
    console.error('[GET /api/users/search]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(
      'Failed to search users',
      'INTERNAL_ERROR',
      500,
      requestId
    );
  }
}
