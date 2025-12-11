// ============================================================================
// ENHANCED: /src/app/api/matches/route.ts - Match Management (List & Create)
// Comprehensive match management with fixtures and leagues
// ============================================================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAnyRole } from '@/lib/api/middleware/auth';
import { success, paginated, created, errorResponse } from '@/lib/api/responses';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { logAuditAction } from '@/lib/api/audit';
import { logger } from '@/lib/api/logger';

// ============================================================================
// GET /api/matches - List Matches
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '25'));
    const skip = (page - 1) * limit;

    // Filters
    const status = url.searchParams.get('status');
    const teamId = url.searchParams.get('teamId');
    const leagueId = url.searchParams.get('leagueId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }

    if (leagueId) {
      where.fixture = { leagueId };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    // Get total
    const total = await prisma.match.count({ where });

    // Fetch matches
    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        referee: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        fixture: { select: { id: true, matchweek: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    logger.info(`Retrieved ${matches.length} matches (page ${page})`);

    return paginated(matches, { page, limit, total });
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ============================================================================
// POST /api/matches - Create Match
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    requireAnyRole(user, ['SUPERADMIN', 'LEAGUE_ADMIN', 'COACH', 'CLUB_MANAGER']);

    const body = await request.json();

    // Validate required fields
    if (!body.homeTeamId || !body.awayTeamId) {
      throw new BadRequestError('homeTeamId and awayTeamId are required');
    }

    if (!body.date) {
      throw new BadRequestError('date is required');
    }

    // Verify teams exist
    const homeTeam = await prisma.team.findUnique({
      where: { id: body.homeTeamId },
    });

    const awayTeam = await prisma.team.findUnique({
      where: { id: body.awayTeamId },
    });

    if (!homeTeam || !awayTeam) {
      throw new NotFoundError('Team');
    }

    if (homeTeam.id === awayTeam.id) {
      throw new BadRequestError('A team cannot play against itself');
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        homeTeamId: body.homeTeamId,
        awayTeamId: body.awayTeamId,
        fixtureId: body.fixtureId,
        refereeId: body.refereeId,
        date: new Date(body.date),
        kickOffTime: body.kickOffTime ? new Date(body.kickOffTime) : undefined,
        venue: body.venue,
        venueCity: body.venueCity,
        status: 'SCHEDULED',
        notes: body.notes,
        sport: body.sport || 'FOOTBALL',
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    // Log audit
    await logAuditAction({
      performedById: user.id,
      action: 'USER_CREATED',
      entityType: 'Match',
      entityId: match.id,
      changes: {
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        date: match.date,
      },
      details: `Created match between ${match.homeTeam.name} and ${match.awayTeam.name}`,
    });

    logger.info(`Match created: ${match.id}`);

    return created(match);
  } catch (error) {
    return errorResponse(error as Error);
  }
}
