import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import {
  createFormattedPDF,
  formatPlayerData,
  formatTeamData,
  formatStandingsData,
  formatMatchData,
  generateFilename,
} from '@/lib/export/export-utils';

/**
 * PDF Export API Route
 * Path: src/app/api/export/pdf/route.ts
 * 
 * POST /api/export/pdf
 * 
 * Generates PDF reports for:
 * - Player statistics
 * - Team standings
 * - League table
 * - Match results
 * 
 * Authentication: Required
 * Rate Limiting: 10 requests per minute per user
 */

// ============================================================================
// TYPES
// ============================================================================

interface ExportPDFRequest {
  fileType: 'players' | 'teams' | 'standings' | 'matches';
  leagueId?: string;
  clubId?: string;
  playerId?: string;
  format?: 'portrait' | 'landscape';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 exports per minute

// Store for rate limiting (in production, use Redis)
const exportCounts = new Map<string, { count: number; resetTime: number }>();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check rate limit for user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = exportCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    exportCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Get player statistics
 */
async function getPlayerStats(leagueId?: string, clubId?: string, playerId?: string) {
  const where: any = {};

  if (leagueId) where.club = { leagueId };
  if (clubId) where.clubId = clubId;
  if (playerId) where.id = playerId;

  return await prisma.player.findMany({
    where,
    include: {
      club: {
        select: { name: true, shortName: true },
      },
    },
    orderBy: { rating: 'desc' },
    take: 1000,
  });
}

/**
 * Get team standings
 */
async function getTeamStandings(leagueId: string) {
  return await prisma.standing.findMany({
    where: { leagueId },
    include: {
      club: {
        select: { name: true, shortName: true },
      },
    },
    orderBy: { points: 'desc' },
  });
}

/**
 * Get team data
 */
async function getTeamData(leagueId?: string, clubId?: string) {
  const where: any = {};

  if (leagueId) where.leagueId = leagueId;
  if (clubId) where.id = clubId;

  return await prisma.club.findMany({
    where,
    include: {
      league: {
        select: { name: true },
      },
      manager: {
        select: { name: true },
      },
      players: {
        select: { id: true },
      },
    },
    take: 1000,
  });
}

/**
 * Get match results
 */
async function getMatchResults(leagueId?: string, clubId?: string) {
  const where: any = {
    status: { not: 'scheduled' },
  };

  if (leagueId) where.leagueId = leagueId;
  if (clubId) {
    where.OR = [
      { homeClubId: clubId },
      { awayClubId: clubId },
    ];
  }

  return await prisma.match.findMany({
    where,
    include: {
      homeClub: {
        select: { name: true, shortName: true },
      },
      awayClub: {
        select: { name: true, shortName: true },
      },
      league: {
        select: { name: true },
      },
      referee: {
        select: { name: true },
      },
    },
    orderBy: { date: 'desc' },
    take: 500,
  });
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 exports per minute.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: ExportPDFRequest = await request.json();
    const { fileType, leagueId, clubId, playerId, format = 'portrait' } = body;

    // Validate fileType
    if (!['players', 'teams', 'standings', 'matches'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    let data: any[] = [];
    let title = '';
    let subtitle = '';
    let filename = '';

    // Fetch data based on file type
    switch (fileType) {
      case 'players': {
        const players = await getPlayerStats(leagueId, clubId, playerId);
        data = formatPlayerData(players);
        title = 'Player Statistics Report';
        subtitle = `Generated ${new Date().toLocaleDateString()}`;
        filename = generateFilename('players', 'pdf');
        break;
      }

      case 'teams': {
        const teams = await getTeamData(leagueId, clubId);
        data = formatTeamData(teams);
        title = 'Team Data Report';
        subtitle = `Generated ${new Date().toLocaleDateString()}`;
        filename = generateFilename('teams', 'pdf');
        break;
      }

      case 'standings': {
        if (!leagueId) {
          return NextResponse.json(
            { error: 'League ID required for standings' },
            { status: 400 }
          );
        }
        const standings = await getTeamStandings(leagueId);
        data = formatStandingsData(standings);
        title = 'League Standings';
        subtitle = `Generated ${new Date().toLocaleDateString()}`;
        filename = generateFilename('standings', 'pdf');
        break;
      }

      case 'matches': {
        const matches = await getMatchResults(leagueId, clubId);
        data = formatMatchData(matches);
        title = 'Match Results Report';
        subtitle = `Generated ${new Date().toLocaleDateString()}`;
        filename = generateFilename('matches', 'pdf');
        break;
      }
    }

    // Generate PDF
    const pdf = await createFormattedPDF(title, subtitle, data, {
      orientation: format,
    });

    // Convert PDF to bytes
    const pdfBytes = Buffer.from(pdf.output('arraybuffer'));

    // Log export for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_PDF',
        resource: `${fileType}_export`,
        details: {
          fileType,
          leagueId,
          clubId,
          playerId,
          recordCount: data.length,
          filename,
        },
      },
    }).catch((err) => {
      console.warn('Failed to log export:', err);
    });

    // Return PDF file
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
