// ============================================================================
// ENHANCED: /src/app/api/search/route.ts
// Global Search API for Players, Clubs, Leagues, and Matches
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/middleware/auth';
import { success, errorResponse } from '@/lib/api/responses';
import { BadRequestError } from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

interface SearchResult {
  id: string;
  type: 'player' | 'club' | 'league' | 'match';
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  metadata?: Record<string, any>;
}

/**
 * GET /api/search
 * Global search across all entities
 * 
 * Query params:
 * - q: Search query (required, min 2 chars)
 * - limit: Max results (default: 20, max: 100)
 * - types: Comma-separated entity types (default: all)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const types = searchParams.get('types')?.split(',') || [
      'player',
      'club',
      'league',
      'match',
    ];

    // Validate query
    if (!query || query.trim().length < 2) {
      return errorResponse(
        new BadRequestError('Search query must be at least 2 characters'),
      );
    }

    const searchTerm = `%${query.trim()}%`;
    const results: SearchResult[] = [];

    // Search Players
    if (types.includes('player')) {
      const players = await prisma.player.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { jerseyNumber: parseInt(query) || 0 },
          ],
        },
        include: {
          club: { select: { name: true, logoUrl: true } },
        },
        take: Math.ceil(limit / 4),
      });

      results.push(
        ...players.map((p) => ({
          id: p.id,
          type: 'player' as const,
          title: `${p.firstName} ${p.lastName}`,
          subtitle: `${p.position} • ${p.club?.name || 'No Club'}`,
          description: `Jersey #${p.jerseyNumber}`,
          href: `/dashboard/players-v2/${p.id}`,
          metadata: {
            position: p.position,
            clubId: p.clubId,
            clubName: p.club?.name,
          },
        })),
      );
    }

    // Search Clubs
    if (types.includes('club')) {
      const clubs = await prisma.club.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { shortName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: Math.ceil(limit / 4),
      });

      results.push(
        ...clubs.map((c) => ({
          id: c.id,
          type: 'club' as const,
          title: c.name,
          subtitle: c.shortName,
          href: `/dashboard/clubs/${c.id}`,
          metadata: {
            city: c.city,
            country: c.country,
          },
        })),
      );
    }

    // Search Leagues
    if (types.includes('league')) {
      const leagues = await prisma.league.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: Math.ceil(limit / 4),
      });

      results.push(
        ...leagues.map((l) => ({
          id: l.id,
          type: 'league' as const,
          title: l.name,
          subtitle: `Season ${l.season}`,
          description: l.description || '',
          href: `/dashboard/leagues/${l.id}`,
          metadata: {
            season: l.season,
            status: l.status,
          },
        })),
      );
    }

    // Search Matches
    if (types.includes('match')) {
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { homeClub: { name: { contains: query, mode: 'insensitive' } } },
            { awayClub: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        include: {
          homeClub: { select: { name: true, shortName: true } },
          awayClub: { select: { name: true, shortName: true } },
          fixture: { select: { leagueId: true } },
        },
        take: Math.ceil(limit / 4),
      });

      results.push(
        ...matches.map((m) => ({
          id: m.id,
          type: 'match' as const,
          title: `${m.homeClub.shortName} vs ${m.awayClub.shortName}`,
          subtitle: new Date(m.scheduledDate).toLocaleDateString(),
          description: m.status,
          href: `/dashboard/matches-v2/${m.id}`,
          metadata: {
            homeTeam: m.homeClub.name,
            awayTeam: m.awayClub.name,
            status: m.status,
            leagueId: m.fixture.leagueId,
          },
        })),
      );
    }

    // Sort by type order and limit
    const sorted = results.slice(0, limit);

    logger.info('Global search performed', {
      query: query.trim(),
      resultCount: sorted.length,
      types,
    });

    return success(sorted);
  } catch (error) {
    logger.error('Error performing global search:', error);
    return errorResponse(error as Error);
  }
}

/**
 * GET /api/search/advanced
 * Advanced search with filtering
 */
export async function GET2(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const types = searchParams.get('types')?.split(',') || [];
    const positions = searchParams.get('positions')?.split(',') || [];
    const leagues = searchParams.get('leagues')?.split(',') || [];
    const clubs = searchParams.get('clubs')?.split(',') || [];
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const maxRating = parseFloat(searchParams.get('maxRating') || '10');

    const results: SearchResult[] = [];

    // Filtered player search
    if (types.includes('player')) {
      const players = await prisma.player.findMany({
        where: {
          ...(positions.length && { position: { in: positions } }),
          ...(clubs.length && { clubId: { in: clubs } }),
        },
        include: {
          club: { select: { name: true } },
        },
        take: 50,
      });

      results.push(
        ...players.map((p) => ({
          id: p.id,
          type: 'player' as const,
          title: `${p.firstName} ${p.lastName}`,
          subtitle: `${p.position} • ${p.club?.name}`,
          href: `/dashboard/players-v2/${p.id}`,
        })),
      );
    }

    // Filtered club search
    if (types.includes('club')) {
      const clubList = await prisma.club.findMany({
        where: {
          ...(leagues.length && { leagueId: { in: leagues } }),
        },
        take: 50,
      });

      results.push(
        ...clubList.map((c) => ({
          id: c.id,
          type: 'club' as const,
          title: c.name,
          subtitle: c.shortName,
          href: `/dashboard/clubs/${c.id}`,
        })),
      );
    }

    logger.info('Advanced search performed', {
      types,
      positions,
      leagues,
      clubs,
      resultCount: results.length,
    });

    return success(results);
  } catch (error) {
    logger.error('Error performing advanced search:', error);
    return errorResponse(error as Error);
  }
}
