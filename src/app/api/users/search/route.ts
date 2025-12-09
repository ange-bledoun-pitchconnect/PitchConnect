/**
 * User Search API Endpoint
 * GET    /api/users/search  - Search for users by email or name
 * 
 * Schema-Aligned: User model in Prisma
 * - Uses 'avatar' field instead of 'image'
 * - Includes proper user profile fields
 * - Comprehensive filtering and pagination
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  status: UserStatus;
  nationality?: string | null;
  phoneNumber?: string | null;
  createdAt: string;
}

interface SearchUsersResponse {
  success: boolean;
  data: UserSearchResult[];
  pagination: {
    limit: number;
    returned: number;
  };
  searchTerm?: string;
  searchType?: 'email' | 'name';
}

interface ErrorResponse {
  success: boolean;
  error: string;
  details?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MIN_SEARCH_LENGTH = 2;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validate search parameters
 */
function validateSearchParams(email?: string, name?: string): {
  valid: boolean;
  error?: string;
} {
  if (!email && !name) {
    return {
      valid: false,
      error: 'Either email or name parameter is required',
    };
  }

  if (email && email.length < MIN_SEARCH_LENGTH) {
    return {
      valid: false,
      error: `Email must be at least ${MIN_SEARCH_LENGTH} characters`,
    };
  }

  if (name && name.length < MIN_SEARCH_LENGTH) {
    return {
      valid: false,
      error: `Name must be at least ${MIN_SEARCH_LENGTH} characters`,
    };
  }

  if (email && email.includes('@') && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  return { valid: true };
}

/**
 * Sanitize search input
 */
function sanitizeSearchInput(input: string): string {
  return input.toString().trim().slice(0, 100); // Limit to 100 chars
}

// ============================================================================
// GET /api/users/search
// ============================================================================

/**
 * Search for users by email or name
 * 
 * Query parameters:
 * - email (optional): Search by email (substring match, case-insensitive)
 * - name (optional): Search by first or last name (substring match, case-insensitive)
 * - limit (optional): Results per page (default 10, max 100)
 * - status (optional): Filter by user status (ACTIVE, SUSPENDED, BANNED, etc.)
 * - exclude (optional): Comma-separated list of user IDs to exclude
 * 
 * Returns: Array of matching User objects
 * 
 * Note: Either email or name must be provided. If both are provided, name takes precedence.
 */
export async function GET(req: NextRequest): Promise<
  NextResponse<SearchUsersResponse | ErrorResponse>
> {
  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          details: 'No valid session found',
        },
        { status: 401 }
      );
    }

    // ========================================================================
    // PARSE QUERY PARAMETERS
    // ========================================================================

    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const statusParam = searchParams.get('status');
    const excludeParam = searchParams.get('exclude');

    // Validate limit
    const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);

    // Sanitize search inputs
    const email = emailParam ? sanitizeSearchInput(emailParam) : undefined;
    const name = nameParam ? sanitizeSearchInput(nameParam) : undefined;

    // ========================================================================
    // VALIDATE SEARCH PARAMETERS
    // ========================================================================

    const validation = validateSearchParams(email, name);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid search parameters',
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // BUILD WHERE CLAUSE
    // ========================================================================

    const where: any = {
      // Always exclude the current user from results
      NOT: {
        id: session.user.id,
      },
    };

    // Add name search (takes precedence over email)
    if (name) {
      where.OR = [
        {
          firstName: {
            contains: name,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: name,
            mode: 'insensitive',
          },
        },
      ];
    } else if (email) {
      // Add email search
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    // Add status filter if provided
    if (statusParam) {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION', 'ARCHIVED'];
      if (validStatuses.includes(statusParam)) {
        where.status = statusParam;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid status',
            details: `Valid statuses: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
    } else {
      // Default: only return ACTIVE users unless specifically filtering
      where.status = 'ACTIVE';
    }

    // Add exclusion filter if provided
    if (excludeParam) {
      const excludeIds = excludeParam.split(',').map((id) => id.trim());
      if (excludeIds.length > 0) {
        where.id = {
          notIn: excludeIds,
        };
      }
    }

    // ========================================================================
    // SEARCH USERS
    // ========================================================================

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        status: true,
        nationality: true,
        phoneNumber: true,
        createdAt: true,
      },
      take: limit,
      orderBy: [
        // Prioritize by matching first name
        name
          ? { firstName: 'asc' }
          : { email: 'asc' },
        // Then by creation date (newest first)
        { createdAt: 'desc' },
      ],
    });

    // ========================================================================
    // BUILD RESPONSE
    // ========================================================================

    const formattedUsers: UserSearchResult[] = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      nationality: user.nationality || undefined,
      phoneNumber: user.phoneNumber || undefined,
      createdAt: user.createdAt.toISOString(),
    }));

    // If no users found
    if (formattedUsers.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          pagination: {
            limit,
            returned: 0,
          },
          searchTerm: email || name,
          searchType: email ? 'email' : 'name',
        },
        { status: 200 }
      );
    }

    // Build response
    const response: SearchUsersResponse = {
      success: true,
      data: formattedUsers,
      pagination: {
        limit,
        returned: formattedUsers.length,
      },
      searchTerm: email || name,
      searchType: email ? 'email' : 'name',
    };

    console.log(
      `✅ User search: found ${formattedUsers.length} results for ${email ? 'email' : 'name'}: ${email || name}`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/users/search error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
