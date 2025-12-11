import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import {
  generateCSV,
  formatPlayerData,
  formatTeamData,
  formatStandingsData,
  formatMatchData,
  generateFilename,
} from '@/lib/export/export-utils';

/**
 * CSV Export API Route
 * Path: src/app/api/export/csv/route.ts
 * 
 * POST /api/export/csv
 * 
 * Generates CSV files for:
 * - Player statistics (Excel-compatible)
 * - Team standings
 * - League table
 * - Match results
 * 
 * Authentication: Required
 * Format: RFC 4180 CSV with proper escaping
 */

interface ExportCSVRequest {
  fileType: 'players' | 'teams' | 'standings' | 'matches';
  leagueId?: string;
  clubId?: string;
  playerId?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

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
    take: 10000,
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
    take: 10000,
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
    take: 5000,
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

    // Parse request body
    const body: ExportCSVRequest = await request.json();
    const { fileType, leagueId, clubId, playerId } = body;

    // Validate fileType
    if (!['players', 'teams', 'standings', 'matches'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    let csvData: any[] = [];
    let filename = '';

    // Fetch data based on file type
    switch (fileType) {
      case 'players': {
        const players = await getPlayerStats(leagueId, clubId, playerId);
        csvData = formatPlayerData(players);
        filename = generateFilename('players', 'csv');
        break;
      }

      case 'teams': {
        const teams = await getTeamData(leagueId, clubId);
        csvData = formatTeamData(teams);
        filename = generateFilename('teams', 'csv');
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
        csvData = formatStandingsData(standings);
        filename = generateFilename('standings', 'csv');
        break;
      }

      case 'matches': {
        const matches = await getMatchResults(leagueId, clubId);
        csvData = formatMatchData(matches);
        filename = generateFilename('matches', 'csv');
        break;
      }
    }

    // Generate CSV
    const csvContent = generateCSV(csvData);

    // Log export for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_CSV',
        resource: `${fileType}_export`,
        details: {
          fileType,
          leagueId,
          clubId,
          playerId,
          recordCount: csvData.length,
          filename,
        },
      },
    }).catch((err) => {
      console.warn('Failed to log export:', err);
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate CSV',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
