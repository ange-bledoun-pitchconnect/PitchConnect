// File: src/app/api/clubs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '@/lib/api/errors';
import { ok, error as errorResponse } from '@/lib/api/responses';
import { requireRole } from '@/lib/api/middleware';
import { createAuditLog } from '@/lib/api/audit';

// Types
interface CreateClubRequest {
  name: string;
  description?: string;
  country: string;
  city?: string;
  foundedYear?: number;
  website?: string;
  email?: string;
  phone?: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  stadium?: {
    name: string;
    capacity: number;
    city: string;
  };
  maxTeams?: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
}

interface ClubResponse {
  id: string;
  name: string;
  description: string | null;
  country: string;
  city: string | null;
  foundedYear: number | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  logo: string | null;
  colors: Record<string, any> | null;
  stadium: Record<string, any> | null;
  visibility: string;
  maxTeams: number;
  totalTeams: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

interface ErrorResponseType {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

// Validation helper
function validateClubInput(data: any): data is CreateClubRequest {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new BadRequestError('Club name is required and must be a non-empty string');
  }

  if (data.name.length > 100) {
    throw new BadRequestError('Club name must be 100 characters or less');
  }

  if (!data.country || typeof data.country !== 'string') {
    throw new BadRequestError('Country is required');
  }

  if (data.foundedYear && (typeof data.foundedYear !== 'number' || data.foundedYear > new Date().getFullYear())) {
    throw new BadRequestError('Founded year must be a valid year in the past');
  }

  if (data.maxTeams && (typeof data.maxTeams !== 'number' || data.maxTeams < 1)) {
    throw new BadRequestError('Max teams must be a positive number');
  }

  if (!['PUBLIC', 'PRIVATE', 'INVITE_ONLY'].includes(data.visibility)) {
    throw new BadRequestError('Visibility must be PUBLIC, PRIVATE, or INVITE_ONLY');
  }

  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authorization Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, roles: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // 2. Role check - Only CLUBOWNER, SUPERADMIN can create clubs
    requireRole(user, ['CLUBOWNER', 'SUPERADMIN']);

    // 3. Parse and validate request body
    let body: CreateClubRequest;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError('Invalid JSON in request body');
    }

    validateClubInput(body);

    // 4. Check for duplicate club name within same country
    const existingClub = await prisma.club.findFirst({
      where: {
        name: {
          equals: body.name.trim(),
          mode: 'insensitive',
        },
        country: body.country,
      },
    });

    if (existingClub) {
      throw new BadRequestError(`Club "${body.name}" already exists in ${body.country}`);
    }

    // 5. Create club
    const club = await prisma.club.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        country: body.country,
        city: body.city?.trim() || null,
        foundedYear: body.foundedYear || null,
        website: body.website?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        logo: body.logo?.trim() || null,
        colors: body.colors || null,
        stadium: body.stadium || null,
        maxTeams: body.maxTeams || 5,
        visibility: body.visibility,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        teams: {
          select: { id: true },
        },
      },
    });

    // 6. Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CLUBCREATED',
      resourceType: 'Club',
      resourceId: club.id,
      details: {
        clubName: club.name,
        country: club.country,
        visibility: club.visibility,
      },
      requestId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    // 7. Format and return response
    const response: SuccessResponse<ClubResponse> = {
      success: true,
      data: {
        id: club.id,
        name: club.name,
        description: club.description,
        country: club.country,
        city: club.city,
        foundedYear: club.foundedYear,
        website: club.website,
        email: club.email,
        phone: club.phone,
        logo: club.logo,
        colors: club.colors,
        stadium: club.stadium,
        visibility: club.visibility,
        maxTeams: club.maxTeams,
        totalTeams: club.teams.length,
        createdAt: club.createdAt.toISOString(),
        updatedAt: club.updatedAt.toISOString(),
        owner: club.owner,
      },
      message: 'Club created successfully',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[Clubs POST]', {
      requestId,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          code: 'UNAUTHORIZED',
        } as ErrorResponseType,
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          code: 'FORBIDDEN',
        } as ErrorResponseType,
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (err instanceof BadRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          code: 'BADREQUEST',
          details: err.details,
        } as ErrorResponseType,
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create club',
        code: 'INTERNALERROR',
      } as ErrorResponseType,
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// GET Handler - List all clubs with advanced filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    // 2. Parse pagination and filters
    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const search = searchParams.get('search')?.trim() || null;
    const country = searchParams.get('country')?.trim() || null;
    const visibility = searchParams.get('visibility') || null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // 3. Build filter
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (country) {
      where.country = country;
    }

    if (visibility && ['PUBLIC', 'PRIVATE', 'INVITE_ONLY'].includes(visibility)) {
      where.visibility = visibility;
    }

    // 4. Fetch clubs and total count
    const [clubs, totalCount] = await Promise.all([
      prisma.club.findMany({
        where,
        include: {
          owner: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          teams: {
            select: { id: true },
          },
          _count: {
            select: { leagues: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.club.count({ where }),
    ]);

    // 5. Format response
    const pages = Math.ceil(totalCount / limit);
    const response = {
      success: true,
      data: clubs.map((club) => ({
        id: club.id,
        name: club.name,
        description: club.description,
        country: club.country,
        city: club.city,
        visibility: club.visibility,
        totalTeams: club.teams.length,
        totalLeagues: club._count?.leagues || 0,
        createdAt: club.createdAt.toISOString(),
        owner: club.owner,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages,
        hasMore: page < pages,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    });
  } catch (err) {
    console.error('[Clubs GET]', {
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });

    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, error: err.message, code: 'UNAUTHORIZED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch clubs', code: 'INTERNALERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}
