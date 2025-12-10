// ============================================================================
// src/app/api/clubs/route.ts
// POST - Create club | GET - List clubs with advanced filtering
// ALIGNED WITH: Your Prisma schema (Club, Team, User relationships)
// ============================================================================

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  parseJsonBody,
  validateRequired,
  validateStringLength,
  validateEmail,
  validatePhoneNumber,
  validateUrl,
} from '@/lib/api/validation';
import { errorResponse } from '@/lib/api/responses';
import { NotFoundError, ForbiddenError } from '@/lib/api/errors';
import { logResourceCreated } from '@/lib/api/audit';

/**
 * POST /api/clubs
 * Create a new sports club
 * 
 * Request Body:
 *   Required:
 *     - name: string (3-150 chars)
 *     - shortCode: string (2-10 chars, unique globally)
 *     - city: string
 *     - country: string
 *   
 *   Optional:
 *     - founded: number (year)
 *     - description: string
 *     - logo: string (URL)
 *     - website: string (URL)
 *     - contactEmail: string
 *     - contactPhone: string
 *     - ownerId: string (defaults to current user)
 * 
 * Authorization: SUPERADMIN only
 * Returns: 201 Created
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPERADMIN can create clubs
    const isSuperAdmin = session.user.roles?.includes('SUPERADMIN');
    if (!isSuperAdmin) {
      throw new ForbiddenError('Only SUPERADMIN can create clubs');
    }

    const body = await parseJsonBody(request);

    // Validate required fields
    validateRequired(body, ['name', 'shortCode', 'city', 'country']);

    // Validate field formats
    validateStringLength(body.name, 3, 150, 'Club name');
    validateStringLength(body.shortCode, 2, 10, 'Club short code');

    if (!/^[A-Z0-9]+$/.test(body.shortCode)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Short code must contain only uppercase letters and numbers',
        },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (body.contactEmail) validateEmail(body.contactEmail);
    if (body.contactPhone) validatePhoneNumber(body.contactPhone);
    if (body.logo) validateUrl(body.logo, 'Logo URL');
    if (body.website) validateUrl(body.website, 'Website URL');

    // Determine owner
    const ownerId = body.ownerId || session.user.id;

    // Verify owner exists
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!owner) {
      throw new NotFoundError('Owner not found');
    }

    // Check for duplicate short code globally
    const existingClub = await prisma.club.findFirst({
      where: {
        shortCode: body.shortCode.toUpperCase(),
      },
    });

    if (existingClub) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'A club with this short code already exists',
        },
        { status: 409 }
      );
    }

    // Create club
    const club = await prisma.club.create({
      data: {
        name: body.name.trim(),
        shortCode: body.shortCode.toUpperCase(),
        city: body.city.trim(),
        country: body.country.trim(),
        founded: body.founded || new Date().getFullYear(),
        description: body.description || null,
        logo: body.logo || null,
        website: body.website || null,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        ownerId,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Log audit trail
    await logResourceCreated(
      session.user.id,
      'Club',
      club.id,
      club.name,
      {
        city: club.city,
        country: club.country,
        shortCode: club.shortCode,
        owner: owner.firstName + ' ' + owner.lastName,
      },
      `Created club: ${club.name} in ${club.city}, ${club.country}`
    );

    return NextResponse.json(
      {
        id: club.id,
        name: club.name,
        shortCode: club.shortCode,
        city: club.city,
        country: club.country,
        founded: club.founded,
        description: club.description,
        logo: club.logo,
        website: club.website,
        contactEmail: club.contactEmail,
        contactPhone: club.contactPhone,
        owner: {
          id: club.owner.id,
          name: `${club.owner.firstName} ${club.owner.lastName}`,
        },
        stats: {
          teamCount: 0,
          playerCount: 0,
          leagueCount: 0,
        },
        message: `Club '${club.name}' created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/clubs] Error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * GET /api/clubs
 * List clubs with advanced filtering and pagination
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 25, max: 100)
 *   - country: string (filter by country)
 *   - ownerId: string (filter by owner)
 *   - search: string (search by name/code/city)
 *   - sortBy: string (created, name)
 *   - sortOrder: asc|desc
 * 
 * Returns: 200 OK with paginated clubs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    const country = searchParams.get('country');
    const ownerId = searchParams.get('ownerId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: any = {};

    if (country) where.country = country;
    if (ownerId) where.ownerId = ownerId;

    // Search by name, code, or city
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search.toUpperCase() } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.club.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Fetch clubs
    const clubs = await prisma.club.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        teams: {
          select: { id: true },
        },
        _count: {
          select: {
            teams: true,
            leagueTeams: true,
          },
        },
      },
      orderBy: sortBy === 'name' ? { name: sortOrder } : { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate player count per club (counting from teams)
    const formattedClubs = await Promise.all(
      clubs.map(async (club) => {
        const playerCount = await prisma.playerTeam.count({
          where: {
            team: { clubId: club.id },
          },
        });

        return {
          id: club.id,
          name: club.name,
          shortCode: club.shortCode,
          city: club.city,
          country: club.country,
          founded: club.founded,
          description: club.description,
          logo: club.logo,
          website: club.website,
          owner: {
            id: club.owner.id,
            name: `${club.owner.firstName} ${club.owner.lastName}`,
          },
          stats: {
            teamCount: club._count.teams,
            playerCount,
            leagueCount: club._count.leagueTeams,
          },
        };
      })
    );

    return NextResponse.json(
      {
        clubs: formattedClubs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/clubs] Error:', error);
    return errorResponse(error as Error);
  }
}
