// =============================================================================
// 🔍 GLOBAL SEARCH API - Enterprise-Grade Implementation
// =============================================================================
// GET /api/search - Search across all entities
// =============================================================================
// Schema: v7.8.0 | Multi-Sport: ✅ All 12 sports
// Entities: Players, Teams, Clubs, Matches, Training, Coaches, Staff, Media
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Sport, Prisma } from '@prisma/client';

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

type EntityType = 'player' | 'team' | 'club' | 'match' | 'training' | 'coach' | 'staff' | 'media' | 'document';

interface SearchResult {
  id: string;
  type: EntityType;
  title: string;
  subtitle: string | null;
  description: string | null;
  avatar: string | null;
  href: string;
  sport: Sport | null;
  metadata: Record<string, unknown>;
  relevanceScore: number;
}

interface SearchResponse {
  results: SearchResult[];
  grouped: Record<EntityType, SearchResult[]>;
  counts: Record<EntityType, number>;
  totalResults: number;
  query: string;
  searchTime: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const ALL_ENTITY_TYPES: EntityType[] = [
  'player',
  'team',
  'club',
  'match',
  'training',
  'coach',
  'staff',
  'media',
  'document',
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SearchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(200),
  types: z.string().optional(), // Comma-separated entity types
  sport: z.nativeEnum(Sport).optional(),
  clubId: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeInactive: z.coerce.boolean().default(false),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateRequestId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 * Calculate relevance score based on match quality
 */
function calculateRelevance(
  searchTerm: string,
  title: string,
  description: string | null
): number {
  const lowerSearch = searchTerm.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerDesc = (description || '').toLowerCase();

  let score = 0;

  // Exact match in title
  if (lowerTitle === lowerSearch) score += 100;
  // Starts with search term
  else if (lowerTitle.startsWith(lowerSearch)) score += 80;
  // Contains search term
  else if (lowerTitle.includes(lowerSearch)) score += 60;

  // Match in description
  if (lowerDesc.includes(lowerSearch)) score += 20;

  // Word boundary match
  const words = lowerTitle.split(/\s+/);
  if (words.some(w => w === lowerSearch)) score += 30;
  if (words.some(w => w.startsWith(lowerSearch))) score += 15;

  return score;
}

/**
 * Parse entity types from comma-separated string
 */
function parseEntityTypes(typesParam: string | undefined): EntityType[] {
  if (!typesParam) return ALL_ENTITY_TYPES;
  
  const types = typesParam.split(',').map(t => t.trim().toLowerCase()) as EntityType[];
  return types.filter(t => ALL_ENTITY_TYPES.includes(t));
}

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

async function searchPlayers(
  query: string,
  limit: number,
  clubIds: string[],
  sport?: Sport
): Promise<SearchResult[]> {
  const players = await prisma.player.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      user: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      ...(clubIds.length > 0 && {
        teamPlayers: {
          some: {
            isActive: true,
            team: { clubId: { in: clubIds } },
          },
        },
      }),
      ...(sport && {
        teamPlayers: {
          some: {
            team: { club: { sport } },
          },
        },
      }),
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, avatar: true },
      },
      teamPlayers: {
        where: { isActive: true },
        take: 1,
        include: {
          team: {
            include: {
              club: { select: { name: true, sport: true } },
            },
          },
        },
      },
    },
    take: limit,
  });

  return players.map((p) => {
    const fullName = `${p.user.firstName} ${p.user.lastName}`;
    const team = p.teamPlayers[0]?.team;
    
    return {
      id: p.id,
      type: 'player' as EntityType,
      title: fullName,
      subtitle: team ? `${team.name} • ${team.club.name}` : null,
      description: p.primaryPosition || null,
      avatar: p.user.avatar,
      href: `/players/${p.id}`,
      sport: team?.club.sport || null,
      metadata: {
        position: p.primaryPosition,
        rating: p.overallRating,
        teamId: team?.id,
        clubId: team?.clubId,
      },
      relevanceScore: calculateRelevance(query, fullName, p.primaryPosition),
    };
  });
}

async function searchTeams(
  query: string,
  limit: number,
  clubIds: string[],
  sport?: Sport
): Promise<SearchResult[]> {
  const teams = await prisma.team.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { club: { name: { contains: query, mode: 'insensitive' } } },
      ],
      ...(clubIds.length > 0 && { clubId: { in: clubIds } }),
      ...(sport && { club: { sport } }),
    },
    include: {
      club: {
        select: { id: true, name: true, logo: true, sport: true },
      },
      _count: {
        select: { players: { where: { isActive: true } } },
      },
    },
    take: limit,
  });

  return teams.map((t) => ({
    id: t.id,
    type: 'team' as EntityType,
    title: t.name,
    subtitle: t.club.name,
    description: t.ageGroup ? `${t.ageGroup} • ${t._count.players} players` : `${t._count.players} players`,
    avatar: t.logo || t.club.logo,
    href: `/teams/${t.id}`,
    sport: t.club.sport,
    metadata: {
      clubId: t.clubId,
      ageGroup: t.ageGroup,
      gender: t.gender,
      playerCount: t._count.players,
    },
    relevanceScore: calculateRelevance(query, t.name, t.club.name),
  }));
}

async function searchClubs(
  query: string,
  limit: number,
  sport?: Sport
): Promise<SearchResult[]> {
  const clubs = await prisma.club.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { shortName: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ],
      ...(sport && { sport }),
    },
    include: {
      _count: {
        select: { teams: true, members: { where: { isActive: true } } },
      },
    },
    take: limit,
  });

  return clubs.map((c) => ({
    id: c.id,
    type: 'club' as EntityType,
    title: c.name,
    subtitle: c.city ? `${c.city}, ${c.country}` : c.country,
    description: `${c._count.teams} teams • ${c._count.members} members`,
    avatar: c.logo,
    href: `/clubs/${c.id}`,
    sport: c.sport,
    metadata: {
      shortName: c.shortName,
      city: c.city,
      country: c.country,
      teamCount: c._count.teams,
      memberCount: c._count.members,
    },
    relevanceScore: calculateRelevance(query, c.name, c.city),
  }));
}

async function searchMatches(
  query: string,
  limit: number,
  clubIds: string[],
  sport?: Sport
): Promise<SearchResult[]> {
  const matches = await prisma.match.findMany({
    where: {
      deletedAt: null,
      OR: [
        { homeTeam: { name: { contains: query, mode: 'insensitive' } } },
        { awayTeam: { name: { contains: query, mode: 'insensitive' } } },
        { homeTeam: { club: { name: { contains: query, mode: 'insensitive' } } } },
        { awayTeam: { club: { name: { contains: query, mode: 'insensitive' } } } },
        { venue: { name: { contains: query, mode: 'insensitive' } } },
      ],
      ...(clubIds.length > 0 && {
        OR: [
          { homeTeam: { clubId: { in: clubIds } } },
          { awayTeam: { clubId: { in: clubIds } } },
        ],
      }),
      ...(sport && {
        homeTeam: { club: { sport } },
      }),
    },
    include: {
      homeTeam: {
        include: { club: { select: { name: true, sport: true } } },
      },
      awayTeam: {
        include: { club: { select: { name: true, sport: true } } },
      },
      venue: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return matches.map((m) => {
    const title = `${m.homeTeam.name} vs ${m.awayTeam.name}`;
    const dateStr = m.date.toLocaleDateString();

    return {
      id: m.id,
      type: 'match' as EntityType,
      title,
      subtitle: m.venue?.name || m.location,
      description: `${dateStr} • ${m.status}`,
      avatar: null,
      href: `/matches/${m.id}`,
      sport: m.homeTeam.club.sport,
      metadata: {
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        date: m.date.toISOString(),
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
      },
      relevanceScore: calculateRelevance(query, title, m.venue?.name || null),
    };
  });
}

async function searchTraining(
  query: string,
  limit: number,
  clubIds: string[],
  sport?: Sport
): Promise<SearchResult[]> {
  const sessions = await prisma.training.findMany({
    where: {
      deletedAt: null,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { type: { contains: query, mode: 'insensitive' } },
        { team: { name: { contains: query, mode: 'insensitive' } } },
        { venue: { name: { contains: query, mode: 'insensitive' } } },
      ],
      ...(clubIds.length > 0 && {
        team: { clubId: { in: clubIds } },
      }),
      ...(sport && {
        team: { club: { sport } },
      }),
    },
    include: {
      team: {
        include: { club: { select: { sport: true } } },
      },
      venue: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return sessions.map((t) => ({
    id: t.id,
    type: 'training' as EntityType,
    title: t.title || `${t.type} Training`,
    subtitle: t.team.name,
    description: `${t.date.toLocaleDateString()} • ${t.startTime}`,
    avatar: null,
    href: `/training/${t.id}`,
    sport: t.team.club.sport,
    metadata: {
      teamId: t.teamId,
      date: t.date.toISOString(),
      type: t.type,
      venue: t.venue?.name || t.location,
    },
    relevanceScore: calculateRelevance(query, t.title || t.type || '', t.team.name),
  }));
}

async function searchCoaches(
  query: string,
  limit: number,
  clubIds: string[],
  sport?: Sport
): Promise<SearchResult[]> {
  const coaches = await prisma.coach.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      user: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      ...(clubIds.length > 0 && {
        clubMembers: {
          some: {
            clubId: { in: clubIds },
            isActive: true,
          },
        },
      }),
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, avatar: true },
      },
      clubMembers: {
        where: { isActive: true },
        take: 1,
        include: {
          club: { select: { name: true, sport: true } },
        },
      },
    },
    take: limit,
  });

  return coaches.map((c) => {
    const fullName = `${c.user.firstName} ${c.user.lastName}`;
    const club = c.clubMembers[0]?.club;

    return {
      id: c.id,
      type: 'coach' as EntityType,
      title: fullName,
      subtitle: club?.name || null,
      description: c.specialization ? `${c.specialization} Coach` : 'Coach',
      avatar: c.user.avatar,
      href: `/coaches/${c.id}`,
      sport: club?.sport || null,
      metadata: {
        specialization: c.specialization,
        licenseLevel: c.licenseLevel,
        clubId: c.clubMembers[0]?.clubId,
      },
      relevanceScore: calculateRelevance(query, fullName, c.specialization),
    };
  });
}

async function searchStaff(
  query: string,
  limit: number,
  clubIds: string[]
): Promise<SearchResult[]> {
  const staff = await prisma.clubMember.findMany({
    where: {
      isActive: true,
      role: { notIn: ['PLAYER'] },
      OR: [
        { user: { firstName: { contains: query, mode: 'insensitive' } } },
        { user: { lastName: { contains: query, mode: 'insensitive' } } },
      ],
      ...(clubIds.length > 0 && { clubId: { in: clubIds } }),
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      club: {
        select: { name: true, sport: true },
      },
    },
    take: limit,
  });

  return staff.map((s) => {
    const fullName = `${s.user.firstName} ${s.user.lastName}`;

    return {
      id: s.id,
      type: 'staff' as EntityType,
      title: fullName,
      subtitle: s.club.name,
      description: s.role.replace('_', ' '),
      avatar: s.user.avatar,
      href: `/staff/${s.user.id}`,
      sport: s.club.sport,
      metadata: {
        role: s.role,
        clubId: s.clubId,
        userId: s.userId,
      },
      relevanceScore: calculateRelevance(query, fullName, s.role),
    };
  });
}

async function searchMedia(
  query: string,
  limit: number,
  clubIds: string[]
): Promise<SearchResult[]> {
  const media = await prisma.mediaContent.findMany({
    where: {
      deletedAt: null,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
      ],
      ...(clubIds.length > 0 && { clubId: { in: clubIds } }),
    },
    include: {
      club: { select: { name: true, sport: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return media.map((m) => ({
    id: m.id,
    type: 'media' as EntityType,
    title: m.title,
    subtitle: m.club?.name || null,
    description: `${m.type} • ${m.category}`,
    avatar: m.thumbnailUrl,
    href: `/media/${m.id}`,
    sport: m.club?.sport || null,
    metadata: {
      type: m.type,
      category: m.category,
      fileUrl: m.fileUrl,
      clubId: m.clubId,
    },
    relevanceScore: calculateRelevance(query, m.title, m.description),
  }));
}

async function searchDocuments(
  query: string,
  limit: number,
  clubIds: string[]
): Promise<SearchResult[]> {
  const documents = await prisma.document.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
      ...(clubIds.length > 0 && { clubId: { in: clubIds } }),
    },
    include: {
      club: { select: { name: true, sport: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return documents.map((d) => ({
    id: d.id,
    type: 'document' as EntityType,
    title: d.name,
    subtitle: d.club?.name || null,
    description: d.category || d.type,
    avatar: null,
    href: `/documents/${d.id}`,
    sport: d.club?.sport || null,
    metadata: {
      type: d.type,
      category: d.category,
      fileUrl: d.fileUrl,
      clubId: d.clubId,
    },
    relevanceScore: calculateRelevance(query, d.name, d.description),
  }));
}

// =============================================================================
// GET HANDLER - Global Search
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = SearchQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return createResponse(null, {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Invalid search query',
        },
        requestId,
        status: 400,
      });
    }

    const { q: query, types, sport, clubId, limit } = validation.data;

    // 3. Get user's accessible clubs
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isSuperAdmin: true,
        clubMembers: {
          where: { isActive: true },
          select: { clubId: true },
        },
      },
    });

    // Determine club scope
    let clubIds: string[] = [];
    if (!user?.isSuperAdmin) {
      if (clubId) {
        // Verify user has access to this club
        const hasAccess = user?.clubMembers.some(m => m.clubId === clubId);
        if (hasAccess) {
          clubIds = [clubId];
        }
      } else {
        clubIds = user?.clubMembers.map(m => m.clubId) || [];
      }
    } else if (clubId) {
      clubIds = [clubId];
    }

    // 4. Parse entity types
    const entityTypes = parseEntityTypes(types);
    const perTypeLimit = Math.ceil(limit / entityTypes.length);

    // 5. Execute parallel searches
    const searchPromises: Promise<SearchResult[]>[] = [];

    if (entityTypes.includes('player')) {
      searchPromises.push(searchPlayers(query, perTypeLimit, clubIds, sport));
    }
    if (entityTypes.includes('team')) {
      searchPromises.push(searchTeams(query, perTypeLimit, clubIds, sport));
    }
    if (entityTypes.includes('club')) {
      searchPromises.push(searchClubs(query, perTypeLimit, sport));
    }
    if (entityTypes.includes('match')) {
      searchPromises.push(searchMatches(query, perTypeLimit, clubIds, sport));
    }
    if (entityTypes.includes('training')) {
      searchPromises.push(searchTraining(query, perTypeLimit, clubIds, sport));
    }
    if (entityTypes.includes('coach')) {
      searchPromises.push(searchCoaches(query, perTypeLimit, clubIds, sport));
    }
    if (entityTypes.includes('staff')) {
      searchPromises.push(searchStaff(query, perTypeLimit, clubIds));
    }
    if (entityTypes.includes('media')) {
      searchPromises.push(searchMedia(query, perTypeLimit, clubIds));
    }
    if (entityTypes.includes('document')) {
      searchPromises.push(searchDocuments(query, perTypeLimit, clubIds));
    }

    const searchResults = await Promise.all(searchPromises);

    // 6. Combine and sort results
    const allResults = searchResults.flat();
    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit total results
    const limitedResults = allResults.slice(0, limit);

    // 7. Group results by type
    const grouped = limitedResults.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<EntityType, SearchResult[]>);

    // 8. Count by type
    const counts = allResults.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<EntityType, number>);

    const searchTime = performance.now() - startTime;

    // 9. Build response
    const response: SearchResponse = {
      results: limitedResults,
      grouped,
      counts,
      totalResults: allResults.length,
      query,
      searchTime: Math.round(searchTime),
    };

    console.log(`[${requestId}] Global search completed`, {
      query,
      types: entityTypes,
      totalResults: allResults.length,
      returnedResults: limitedResults.length,
      duration: `${Math.round(searchTime)}ms`,
    });

    return createResponse(response, {
      success: true,
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] GET /api/search error:`, error);
    return createResponse(null, {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Search failed',
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