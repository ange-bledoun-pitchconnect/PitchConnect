// ============================================================================
// 📊 CSV EXPORT API - PitchConnect Enterprise v2.0.0
// ============================================================================
// POST /api/export/csv - Export data as CSV with sport-aware fields
// ============================================================================
// Schema: v7.7.0+ | Multi-Sport | RBAC | RFC 4180 Compliant
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Sport, UserRole } from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ExportType = 'players' | 'teams' | 'standings' | 'matches' | 'training' | 'attendance';

interface CSVRow {
  [key: string]: string | number | boolean | null | undefined;
}

interface SportFieldConfig {
  [key: string]: {
    header: string;
    sports: Sport[];
    formatter?: (value: any) => string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_EXPORT_TYPES: ExportType[] = ['players', 'teams', 'standings', 'matches', 'training', 'attendance'];
const MAX_RECORDS = 50000;
const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

const SPORTS: Sport[] = [
  'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
  'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES', 
  'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL'
];

// ============================================================================
// SPORT-SPECIFIC FIELD CONFIGURATIONS
// ============================================================================

const SPORT_SPECIFIC_PLAYER_FIELDS: SportFieldConfig = {
  // Universal fields
  goals: { header: 'Goals', sports: ['FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL', 'HOCKEY', 'LACROSSE'] },
  assists: { header: 'Assists', sports: ['FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL', 'HOCKEY', 'BASKETBALL', 'LACROSSE'] },
  cleanSheets: { header: 'Clean Sheets', sports: ['FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL', 'HOCKEY'] },
  
  // Rugby-specific
  tries: { header: 'Tries', sports: ['RUGBY'] },
  conversions: { header: 'Conversions', sports: ['RUGBY'] },
  penaltyGoals: { header: 'Penalty Goals', sports: ['RUGBY'] },
  dropGoals: { header: 'Drop Goals', sports: ['RUGBY'] },
  tackles: { header: 'Tackles', sports: ['RUGBY', 'AMERICAN_FOOTBALL'] },
  
  // Cricket-specific
  runsScored: { header: 'Runs Scored', sports: ['CRICKET'] },
  ballsFaced: { header: 'Balls Faced', sports: ['CRICKET'] },
  strikeRate: { header: 'Strike Rate', sports: ['CRICKET'] },
  centuries: { header: 'Centuries', sports: ['CRICKET'] },
  halfCenturies: { header: 'Half Centuries', sports: ['CRICKET'] },
  wicketsTaken: { header: 'Wickets Taken', sports: ['CRICKET'] },
  oversBowled: { header: 'Overs Bowled', sports: ['CRICKET'] },
  economyRate: { header: 'Economy Rate', sports: ['CRICKET'] },
  catches: { header: 'Catches', sports: ['CRICKET'] },
  
  // Basketball-specific
  points: { header: 'Points', sports: ['BASKETBALL', 'GAELIC_FOOTBALL'] },
  rebounds: { header: 'Rebounds', sports: ['BASKETBALL'] },
  steals: { header: 'Steals', sports: ['BASKETBALL', 'HOCKEY'] },
  blocks: { header: 'Blocks', sports: ['BASKETBALL', 'HOCKEY'] },
  threePointers: { header: '3-Pointers', sports: ['BASKETBALL'] },
  freeThrows: { header: 'Free Throws', sports: ['BASKETBALL'] },
  
  // American Football-specific
  touchdowns: { header: 'Touchdowns', sports: ['AMERICAN_FOOTBALL'] },
  passingYards: { header: 'Passing Yards', sports: ['AMERICAN_FOOTBALL'] },
  rushingYards: { header: 'Rushing Yards', sports: ['AMERICAN_FOOTBALL'] },
  receivingYards: { header: 'Receiving Yards', sports: ['AMERICAN_FOOTBALL'] },
  interceptions: { header: 'Interceptions', sports: ['AMERICAN_FOOTBALL'] },
  sacks: { header: 'Sacks', sports: ['AMERICAN_FOOTBALL'] },
  
  // Netball-specific
  goalAttempts: { header: 'Goal Attempts', sports: ['NETBALL'] },
  goalsMade: { header: 'Goals Made', sports: ['NETBALL'] },
  shootingPercentage: { header: 'Shooting %', sports: ['NETBALL'] },
  centrePassReceives: { header: 'Centre Pass Receives', sports: ['NETBALL'] },
  gains: { header: 'Gains', sports: ['NETBALL'] },
  deflections: { header: 'Deflections', sports: ['NETBALL'] },
  
  // Australian Rules-specific
  kicks: { header: 'Kicks', sports: ['AUSTRALIAN_RULES'] },
  handballs: { header: 'Handballs', sports: ['AUSTRALIAN_RULES'] },
  marks: { header: 'Marks', sports: ['AUSTRALIAN_RULES', 'GAELIC_FOOTBALL'] },
  hitouts: { header: 'Hitouts', sports: ['AUSTRALIAN_RULES'] },
  behinds: { header: 'Behinds', sports: ['AUSTRALIAN_RULES'] },
  clearances: { header: 'Clearances', sports: ['AUSTRALIAN_RULES'] },
  
  // Hockey-specific
  powerPlayGoals: { header: 'Power Play Goals', sports: ['HOCKEY'] },
  shorthandedGoals: { header: 'Shorthanded Goals', sports: ['HOCKEY'] },
  penaltyMinutes: { header: 'Penalty Minutes', sports: ['HOCKEY'] },
  plusMinus: { header: '+/-', sports: ['HOCKEY', 'BASKETBALL'] },
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const exportRequestSchema = z.object({
  exportType: z.enum(['players', 'teams', 'standings', 'matches', 'training', 'attendance']),
  competitionId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  seasonId: z.string().cuid().optional(),
  sport: z.enum(SPORTS as [Sport, ...Sport[]]).optional(),
  includeSportSpecific: z.boolean().optional().default(true),
  filters: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    status: z.string().optional(),
    minRating: z.number().optional(),
    maxResults: z.number().max(MAX_RECORDS).optional(),
  }).optional(),
  fields: z.array(z.string()).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `csv-export-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function escapeCSVField(value: any): string {
  if (value === null || value === undefined) return '';
  
  let str = String(value).trim();
  
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  
  return str;
}

function rowToCSV(row: CSVRow, headers: string[]): string {
  return headers.map(header => escapeCSVField(row[header])).join(',');
}

function generateCSV(data: CSVRow[], headers: string[]): string {
  if (data.length === 0) {
    return BOM + 'No data to export\n';
  }
  
  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLines = data.map(row => rowToCSV(row, headers));
  
  return BOM + headerLine + '\n' + dataLines.join('\n') + '\n';
}

function generateFilename(exportType: string, sport?: Sport): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const sportSuffix = sport ? `_${sport.toLowerCase()}` : '';
  return `${exportType}${sportSuffix}_export_${dateStr}.csv`;
}

function getSportSpecificFields(sport: Sport): string[] {
  return Object.entries(SPORT_SPECIFIC_PLAYER_FIELDS)
    .filter(([_, config]) => config.sports.includes(sport))
    .map(([field, _]) => field);
}

// ============================================================================
// AUTHORIZATION CHECK
// ============================================================================

function canExport(userRoles: UserRole[], exportType: ExportType, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  
  const exportPermissions: Record<ExportType, UserRole[]> = {
    players: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'ANALYST'],
    teams: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN'],
    standings: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'PLAYER', 'PARENT'],
    matches: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'REFEREE', 'ANALYST'],
    training: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER'],
    attendance: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER'],
  };
  
  const allowedRoles = exportPermissions[exportType] || [];
  return userRoles.some(role => allowedRoles.includes(role));
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

async function fetchPlayersForExport(
  userId: string,
  filters: any,
  sport?: Sport,
  includeSportSpecific: boolean = true
): Promise<{ data: CSVRow[]; headers: string[] }> {
  const where: any = {};
  
  if (filters?.clubId) {
    where.teamPlayers = {
      some: {
        team: { clubId: filters.clubId },
        isActive: true,
      },
    };
  }
  
  if (filters?.teamId) {
    where.teamPlayers = {
      some: {
        teamId: filters.teamId,
        isActive: true,
      },
    };
  }

  const players = await prisma.player.findMany({
    where: {
      ...where,
      deletedAt: null,
      isActive: true,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          dateOfBirth: true,
          nationality: true,
        },
      },
      aggregateStats: true,
      teamPlayers: {
        where: { isActive: true },
        include: {
          team: {
            include: { club: { select: { name: true, sport: true } } },
          },
        },
        take: 1,
      },
    },
    take: filters?.maxResults || MAX_RECORDS,
  });

  // Base headers
  const baseHeaders = [
    'ID', 'FirstName', 'LastName', 'Email', 'DateOfBirth', 'Nationality',
    'Club', 'Team', 'Position', 'JerseyNumber', 'PreferredFoot',
    'Height', 'Weight', 'MarketValue', 'OverallRating',
    'TotalMatches', 'TotalGoals', 'TotalAssists', 'TotalMinutes',
    'YellowCards', 'RedCards', 'CleanSheets', 'AvgRating', 'Status'
  ];

  // Add sport-specific headers if requested
  let headers = [...baseHeaders];
  if (includeSportSpecific && sport) {
    const sportFields = getSportSpecificFields(sport);
    const sportHeaders = sportFields.map(field => SPORT_SPECIFIC_PLAYER_FIELDS[field].header);
    headers = [...baseHeaders, ...sportHeaders];
  }

  const data: CSVRow[] = players.map(player => {
    const team = player.teamPlayers[0]?.team;
    const club = team?.club;
    const stats = player.aggregateStats;

    const baseData: CSVRow = {
      ID: player.id,
      FirstName: player.user.firstName,
      LastName: player.user.lastName,
      Email: player.user.email,
      DateOfBirth: player.user.dateOfBirth?.toISOString().split('T')[0] || '',
      Nationality: player.user.nationality || player.nationality || '',
      Club: club?.name || '',
      Team: team?.name || '',
      Position: player.primaryPosition || '',
      JerseyNumber: player.jerseyNumber || '',
      PreferredFoot: player.preferredFoot || '',
      Height: player.height || '',
      Weight: player.weight || '',
      MarketValue: player.marketValue || '',
      OverallRating: player.overallRating || '',
      TotalMatches: stats?.totalMatches || 0,
      TotalGoals: stats?.totalGoals || 0,
      TotalAssists: stats?.totalAssists || 0,
      TotalMinutes: stats?.totalMinutes || 0,
      YellowCards: stats?.totalYellowCards || 0,
      RedCards: stats?.totalRedCards || 0,
      CleanSheets: stats?.totalCleanSheets || 0,
      AvgRating: stats?.avgRating || '',
      Status: player.isActive ? 'Active' : 'Inactive',
    };

    // Add sport-specific data
    // Note: In production, this would come from sportSpecificStats JSON field
    // For now, we return empty values as placeholders
    if (includeSportSpecific && sport) {
      const sportFields = getSportSpecificFields(sport);
      sportFields.forEach(field => {
        const header = SPORT_SPECIFIC_PLAYER_FIELDS[field].header;
        baseData[header] = ''; // Would come from player statistics sportSpecificStats JSON
      });
    }

    return baseData;
  });

  return { data, headers };
}

async function fetchTeamsForExport(
  userId: string,
  filters: any,
  sport?: Sport
): Promise<{ data: CSVRow[]; headers: string[] }> {
  const where: any = { deletedAt: null };
  
  if (filters?.clubId) {
    where.clubId = filters.clubId;
  }
  
  if (sport) {
    where.club = { sport };
  }

  const teams = await prisma.team.findMany({
    where,
    include: {
      club: {
        select: { id: true, name: true, sport: true, city: true, country: true },
      },
      players: {
        where: { isActive: true },
        select: { id: true },
      },
      _count: {
        select: {
          homeMatches: true,
          awayMatches: true,
        },
      },
    },
    take: filters?.maxResults || MAX_RECORDS,
  });

  const headers = [
    'ID', 'Name', 'Club', 'Sport', 'AgeGroup', 'Gender', 'Status',
    'PlayerCount', 'TotalMatches', 'City', 'Country', 'CreatedAt'
  ];

  const data: CSVRow[] = teams.map(team => ({
    ID: team.id,
    Name: team.name,
    Club: team.club.name,
    Sport: team.club.sport,
    AgeGroup: team.ageGroup || '',
    Gender: team.gender || '',
    Status: team.status,
    PlayerCount: team.players.length,
    TotalMatches: team._count.homeMatches + team._count.awayMatches,
    City: team.club.city || '',
    Country: team.club.country || '',
    CreatedAt: team.createdAt.toISOString().split('T')[0],
  }));

  return { data, headers };
}

async function fetchStandingsForExport(
  userId: string,
  filters: any,
  sport?: Sport
): Promise<{ data: CSVRow[]; headers: string[] }> {
  if (!filters?.competitionId) {
    throw new Error('Competition ID required for standings export');
  }

  const standings = await prisma.competitionStanding.findMany({
    where: {
      competitionId: filters.competitionId,
    },
    include: {
      competition: {
        select: { name: true, sport: true },
      },
    },
    orderBy: { position: 'asc' },
    take: filters?.maxResults || MAX_RECORDS,
  });

  // Sport-aware headers
  const baseHeaders = ['Position', 'Team', 'Competition', 'Played', 'Won', 'Drawn', 'Lost'];
  
  // Add sport-specific scoring headers
  let scoringHeaders: string[] = [];
  const competitionSport = standings[0]?.competition.sport || sport;
  
  if (competitionSport) {
    switch (competitionSport) {
      case 'RUGBY':
        scoringHeaders = ['TriesFor', 'TriesAgainst', 'PointsFor', 'PointsAgainst', 'PointsDiff', 'BonusPoints', 'Points'];
        break;
      case 'CRICKET':
        scoringHeaders = ['NetRunRate', 'Points'];
        break;
      case 'BASKETBALL':
        scoringHeaders = ['PointsFor', 'PointsAgainst', 'PointsDiff', 'WinPercentage'];
        break;
      default:
        scoringHeaders = ['GoalsFor', 'GoalsAgainst', 'GoalDiff', 'Points'];
    }
  } else {
    scoringHeaders = ['GoalsFor', 'GoalsAgainst', 'GoalDiff', 'Points'];
  }

  const headers = [...baseHeaders, ...scoringHeaders, 'Form'];

  const data: CSVRow[] = standings.map(standing => {
    const baseData: CSVRow = {
      Position: standing.position,
      Team: standing.teamId || 'TBD', // Would need team name lookup
      Competition: standing.competition.name,
      Played: standing.played,
      Won: standing.wins,
      Drawn: standing.draws,
      Lost: standing.losses,
      GoalsFor: standing.goalsFor,
      GoalsAgainst: standing.goalsAgainst,
      GoalDiff: standing.goalDifference,
      Points: standing.points,
      Form: standing.form || '',
    };

    return baseData;
  });

  return { data, headers };
}

async function fetchMatchesForExport(
  userId: string,
  filters: any,
  sport?: Sport
): Promise<{ data: CSVRow[]; headers: string[] }> {
  const where: any = { deletedAt: null };
  
  if (filters?.competitionId) {
    where.competitionId = filters.competitionId;
  }
  
  if (filters?.clubId) {
    where.OR = [
      { homeClubId: filters.clubId },
      { awayClubId: filters.clubId },
    ];
  }
  
  if (filters?.dateFrom) {
    where.kickOffTime = { ...where.kickOffTime, gte: new Date(filters.dateFrom) };
  }
  
  if (filters?.dateTo) {
    where.kickOffTime = { ...where.kickOffTime, lte: new Date(filters.dateTo) };
  }

  const matches = await prisma.match.findMany({
    where,
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      homeClub: { select: { name: true, sport: true } },
      awayClub: { select: { name: true } },
      competition: { select: { name: true } },
      venueRelation: { select: { name: true } },
    },
    orderBy: { kickOffTime: 'desc' },
    take: filters?.maxResults || MAX_RECORDS,
  });

  const headers = [
    'ID', 'Date', 'Time', 'HomeTeam', 'AwayTeam', 'HomeScore', 'AwayScore',
    'HalftimeHome', 'HalftimeAway', 'Competition', 'Sport', 'Venue', 
    'Status', 'MatchType', 'Attendance', 'Weather'
  ];

  const data: CSVRow[] = matches.map(match => ({
    ID: match.id,
    Date: match.kickOffTime.toISOString().split('T')[0],
    Time: match.kickOffTime.toISOString().split('T')[1].substring(0, 5),
    HomeTeam: match.homeTeam?.name || 'TBD',
    AwayTeam: match.awayTeam?.name || 'TBD',
    HomeScore: match.homeScore ?? '',
    AwayScore: match.awayScore ?? '',
    HalftimeHome: match.homeHalftimeScore ?? '',
    HalftimeAway: match.awayHalftimeScore ?? '',
    Competition: match.competition?.name || '',
    Sport: match.homeClub.sport,
    Venue: match.venueRelation?.name || match.venue || '',
    Status: match.status,
    MatchType: match.matchType,
    Attendance: match.attendance || '',
    Weather: match.weather || '',
  }));

  return { data, headers };
}

// ============================================================================
// POST /api/export/csv
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 2. GET USER & CHECK PERMISSIONS
    // ========================================================================

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true, isSuperAdmin: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' }, requestId },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 3. PARSE & VALIDATE REQUEST
    // ========================================================================

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validation = exportRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.flatten() }, requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const input = validation.data;

    // ========================================================================
    // 4. AUTHORIZATION CHECK
    // ========================================================================

    if (!canExport(user.roles, input.exportType, user.isSuperAdmin)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to export this data' }, requestId },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    // ========================================================================
    // 5. FETCH DATA
    // ========================================================================

    let csvData: { data: CSVRow[]; headers: string[] };
    const filters = { ...input.filters, clubId: input.clubId, teamId: input.teamId, competitionId: input.competitionId };

    switch (input.exportType) {
      case 'players':
        csvData = await fetchPlayersForExport(user.id, filters, input.sport, input.includeSportSpecific);
        break;
      case 'teams':
        csvData = await fetchTeamsForExport(user.id, filters, input.sport);
        break;
      case 'standings':
        csvData = await fetchStandingsForExport(user.id, filters, input.sport);
        break;
      case 'matches':
        csvData = await fetchMatchesForExport(user.id, filters, input.sport);
        break;
      case 'training':
      case 'attendance':
        // TODO: Implement these exporters
        return NextResponse.json(
          { success: false, error: { code: 'NOT_IMPLEMENTED', message: `${input.exportType} export coming soon` }, requestId },
          { status: 501, headers: { 'X-Request-ID': requestId } }
        );
      default:
        throw new Error(`Unknown export type: ${input.exportType}`);
    }

    // ========================================================================
    // 6. GENERATE CSV
    // ========================================================================

    const csvContent = generateCSV(csvData.data, csvData.headers);
    const fileSizeBytes = new TextEncoder().encode(csvContent).length;
    const filename = generateFilename(input.exportType, input.sport);

    // ========================================================================
    // 7. AUDIT LOG
    // ========================================================================

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DATA_EXPORTED',
        resourceType: 'Export',
        resourceId: requestId,
        afterState: {
          exportType: input.exportType,
          sport: input.sport,
          recordCount: csvData.data.length,
          fileSizeBytes,
          filename,
        },
        ipAddress: clientIp,
        requestId,
      },
    });

    const duration = Date.now() - startTime;
    console.log('[CSV_EXPORT]', {
      requestId,
      userId: user.id,
      exportType: input.exportType,
      sport: input.sport,
      recordCount: csvData.data.length,
      fileSizeBytes,
      durationMs: duration,
    });

    // ========================================================================
    // 8. RETURN CSV FILE
    // ========================================================================

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': String(fileSizeBytes),
        'X-Request-ID': requestId,
        'X-Record-Count': String(csvData.data.length),
        'X-Processing-Time-Ms': String(duration),
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CSV_EXPORT_ERROR]', { requestId, error, durationMs: duration });

    const errorMessage = error instanceof Error ? error.message : 'Export failed';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        requestId,
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

// ============================================================================
// HTTP OPTIONS (for CORS preflight)
// ============================================================================

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
