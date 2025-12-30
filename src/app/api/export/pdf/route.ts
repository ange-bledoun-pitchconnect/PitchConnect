// ============================================================================
// 📄 PDF EXPORT API - PitchConnect Enterprise v2.0.0
// ============================================================================
// POST /api/export/pdf - Export data as PDF with professional formatting
// ============================================================================
// Schema: v7.7.0+ | Multi-Sport | RBAC | Professional Reports
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Sport, UserRole } from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ExportType = 'players' | 'teams' | 'standings' | 'matches' | 'performance';
type PageOrientation = 'portrait' | 'landscape';

interface TableData {
  headers: string[];
  rows: (string | number)[][];
  totals?: Record<string, number>;
}

interface PDFSection {
  title: string;
  type: 'table' | 'text' | 'chart' | 'summary';
  data: TableData | string | any;
}

interface PDFReport {
  title: string;
  subtitle: string;
  generatedAt: Date;
  generatedBy: string;
  sport?: Sport;
  sections: PDFSection[];
  metadata: {
    recordCount: number;
    exportType: ExportType;
    filters: any;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_EXPORT_TYPES: ExportType[] = ['players', 'teams', 'standings', 'matches', 'performance'];
const MAX_RECORDS_PDF = 5000; // Lower limit for PDFs due to size
const SPORTS: Sport[] = [
  'FOOTBALL', 'NETBALL', 'RUGBY', 'CRICKET', 'AMERICAN_FOOTBALL',
  'BASKETBALL', 'HOCKEY', 'LACROSSE', 'AUSTRALIAN_RULES', 
  'GAELIC_FOOTBALL', 'FUTSAL', 'BEACH_FOOTBALL'
];

// Sport-specific terminology
const SPORT_TERMINOLOGY: Record<Sport, { goal: string; point: string; assist: string }> = {
  FOOTBALL: { goal: 'Goal', point: 'Goal', assist: 'Assist' },
  FUTSAL: { goal: 'Goal', point: 'Goal', assist: 'Assist' },
  BEACH_FOOTBALL: { goal: 'Goal', point: 'Goal', assist: 'Assist' },
  NETBALL: { goal: 'Goal', point: 'Goal', assist: 'Feed' },
  RUGBY: { goal: 'Try', point: 'Point', assist: 'Try Assist' },
  CRICKET: { goal: 'Run', point: 'Run', assist: 'Catch' },
  AMERICAN_FOOTBALL: { goal: 'Touchdown', point: 'Point', assist: 'Assist' },
  BASKETBALL: { goal: 'Basket', point: 'Point', assist: 'Assist' },
  HOCKEY: { goal: 'Goal', point: 'Point', assist: 'Assist' },
  LACROSSE: { goal: 'Goal', point: 'Point', assist: 'Assist' },
  AUSTRALIAN_RULES: { goal: 'Goal', point: 'Point', assist: 'Assist' },
  GAELIC_FOOTBALL: { goal: 'Goal', point: 'Point', assist: 'Assist' },
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const exportRequestSchema = z.object({
  exportType: z.enum(['players', 'teams', 'standings', 'matches', 'performance']),
  competitionId: z.string().cuid().optional(),
  clubId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  playerId: z.string().cuid().optional(),
  seasonId: z.string().cuid().optional(),
  sport: z.enum(SPORTS as [Sport, ...Sport[]]).optional(),
  format: z.enum(['portrait', 'landscape']).optional().default('portrait'),
  includeSummary: z.boolean().optional().default(true),
  includeCharts: z.boolean().optional().default(false),
  filters: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    status: z.string().optional(),
    maxResults: z.number().max(MAX_RECORDS_PDF).optional(),
  }).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRequestId(): string {
  return `pdf-export-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateFilename(exportType: string, sport?: Sport): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const sportSuffix = sport ? `_${sport.toLowerCase()}` : '';
  return `${exportType}${sportSuffix}_report_${dateStr}.pdf`;
}

// ============================================================================
// AUTHORIZATION CHECK
// ============================================================================

function canExport(userRoles: UserRole[], exportType: ExportType, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  
  const exportPermissions: Record<ExportType, UserRole[]> = {
    players: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'ANALYST', 'SCOUT'],
    teams: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN'],
    standings: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'PLAYER', 'PARENT'],
    matches: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'REFEREE', 'ANALYST'],
    performance: ['ADMIN', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'SCOUT'],
  };
  
  const allowedRoles = exportPermissions[exportType] || [];
  return userRoles.some(role => allowedRoles.includes(role));
}

// ============================================================================
// HTML-BASED PDF GENERATION (Server-side rendering)
// ============================================================================
// In production, use libraries like:
// - puppeteer (headless Chrome)
// - @react-pdf/renderer (React-based PDF)
// - pdfkit (low-level)
// For this implementation, we generate HTML that can be rendered to PDF

function generatePDFHtml(report: PDFReport, orientation: PageOrientation): string {
  const isLandscape = orientation === 'landscape';
  const pageWidth = isLandscape ? '297mm' : '210mm';
  const pageHeight = isLandscape ? '210mm' : '297mm';
  
  const sportTerm = report.sport ? SPORT_TERMINOLOGY[report.sport] : SPORT_TERMINOLOGY.FOOTBALL;

  const css = `
    @page {
      size: ${pageWidth} ${pageHeight};
      margin: 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1f2121;
      background: white;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #21808d;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header-left h1 {
      font-size: 24pt;
      color: #21808d;
      margin-bottom: 5px;
    }
    
    .header-left h2 {
      font-size: 12pt;
      color: #5e5240;
      font-weight: normal;
    }
    
    .header-right {
      text-align: right;
      font-size: 9pt;
      color: #666;
    }
    
    .sport-badge {
      display: inline-block;
      background: #21808d;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 9pt;
      margin-top: 8px;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 14pt;
      color: #21808d;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    
    th {
      background: #f5f5f5;
      color: #1f2121;
      padding: 8px 6px;
      text-align: left;
      border-bottom: 2px solid #21808d;
      font-weight: 600;
    }
    
    td {
      padding: 6px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    tr:nth-child(even) {
      background: #fafafa;
    }
    
    tr:hover {
      background: #f0f8f9;
    }
    
    .number-cell {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    
    .summary-box {
      background: #f5f5f5;
      border-left: 4px solid #21808d;
      padding: 15px;
      margin-bottom: 20px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-value {
      font-size: 24pt;
      color: #21808d;
      font-weight: bold;
    }
    
    .summary-label {
      font-size: 9pt;
      color: #666;
    }
    
    .footer {
      position: fixed;
      bottom: 10mm;
      left: 15mm;
      right: 15mm;
      border-top: 1px solid #ddd;
      padding-top: 10px;
      font-size: 8pt;
      color: #999;
      display: flex;
      justify-content: space-between;
    }
    
    .confidential {
      color: #c0152f;
      font-weight: bold;
    }
    
    @media print {
      .page-break {
        page-break-before: always;
      }
    }
  `;

  let sectionsHtml = '';
  
  for (const section of report.sections) {
    sectionsHtml += `<div class="section">`;
    sectionsHtml += `<h3 class="section-title">${section.title}</h3>`;
    
    if (section.type === 'summary' && typeof section.data === 'object') {
      const summaryData = section.data as Record<string, number | string>;
      sectionsHtml += `<div class="summary-box"><div class="summary-grid">`;
      
      for (const [key, value] of Object.entries(summaryData)) {
        sectionsHtml += `
          <div class="summary-item">
            <div class="summary-value">${value}</div>
            <div class="summary-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
          </div>
        `;
      }
      
      sectionsHtml += `</div></div>`;
    } else if (section.type === 'table') {
      const tableData = section.data as TableData;
      
      sectionsHtml += `<table><thead><tr>`;
      for (const header of tableData.headers) {
        sectionsHtml += `<th>${header}</th>`;
      }
      sectionsHtml += `</tr></thead><tbody>`;
      
      for (const row of tableData.rows) {
        sectionsHtml += `<tr>`;
        for (let i = 0; i < row.length; i++) {
          const isNumber = typeof row[i] === 'number';
          sectionsHtml += `<td class="${isNumber ? 'number-cell' : ''}">${row[i] ?? ''}</td>`;
        }
        sectionsHtml += `</tr>`;
      }
      
      sectionsHtml += `</tbody></table>`;
    } else if (section.type === 'text') {
      sectionsHtml += `<p>${section.data}</p>`;
    }
    
    sectionsHtml += `</div>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${report.title}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>${report.title}</h1>
          <h2>${report.subtitle}</h2>
          ${report.sport ? `<span class="sport-badge">${report.sport}</span>` : ''}
        </div>
        <div class="header-right">
          <div>Generated: ${report.generatedAt.toLocaleString()}</div>
          <div>By: ${report.generatedBy}</div>
          <div>Records: ${report.metadata.recordCount}</div>
        </div>
      </div>
      
      ${sectionsHtml}
      
      <div class="footer">
        <div class="confidential">CONFIDENTIAL - PitchConnect</div>
        <div>Page 1 of 1</div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// DATA FETCHERS FOR PDF
// ============================================================================

async function fetchPlayersReportData(
  userId: string,
  filters: any,
  sport?: Sport
): Promise<PDFReport> {
  const where: any = { deletedAt: null, isActive: true };
  
  if (filters?.clubId) {
    where.teamPlayers = {
      some: { team: { clubId: filters.clubId }, isActive: true },
    };
  }

  const players = await prisma.player.findMany({
    where,
    include: {
      user: { select: { firstName: true, lastName: true } },
      aggregateStats: true,
      teamPlayers: {
        where: { isActive: true },
        include: { team: { include: { club: { select: { name: true, sport: true } } } } },
        take: 1,
      },
    },
    take: filters?.maxResults || MAX_RECORDS_PDF,
    orderBy: { overallRating: 'desc' },
  });

  // Calculate summary stats
  const totalPlayers = players.length;
  const totalGoals = players.reduce((sum, p) => sum + (p.aggregateStats?.totalGoals || 0), 0);
  const totalAssists = players.reduce((sum, p) => sum + (p.aggregateStats?.totalAssists || 0), 0);
  const avgRating = players.length > 0 
    ? players.reduce((sum, p) => sum + (p.overallRating || 0), 0) / players.length 
    : 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const termGetter = sport ? SPORT_TERMINOLOGY[sport] : SPORT_TERMINOLOGY.FOOTBALL;

  const sections: PDFSection[] = [
    {
      title: 'Summary',
      type: 'summary',
      data: {
        'Total Players': totalPlayers,
        [`Total ${termGetter.goal}s`]: totalGoals,
        [`Total ${termGetter.assist}s`]: totalAssists,
        'Average Rating': avgRating.toFixed(1),
      },
    },
    {
      title: 'Player Statistics',
      type: 'table',
      data: {
        headers: ['Name', 'Team', 'Position', 'Matches', termGetter.goal + 's', termGetter.assist + 's', 'Rating'],
        rows: players.map(p => [
          `${p.user.firstName} ${p.user.lastName}`,
          p.teamPlayers[0]?.team?.name || 'N/A',
          p.primaryPosition || 'N/A',
          p.aggregateStats?.totalMatches || 0,
          p.aggregateStats?.totalGoals || 0,
          p.aggregateStats?.totalAssists || 0,
          p.overallRating?.toFixed(1) || 'N/A',
        ]),
      },
    },
  ];

  return {
    title: 'Player Statistics Report',
    subtitle: sport ? `${sport} Players Overview` : 'All Players Overview',
    generatedAt: new Date(),
    generatedBy: `${user?.firstName} ${user?.lastName}`,
    sport,
    sections,
    metadata: {
      recordCount: totalPlayers,
      exportType: 'players',
      filters,
    },
  };
}

async function fetchStandingsReportData(
  userId: string,
  filters: any,
  sport?: Sport
): Promise<PDFReport> {
  if (!filters?.competitionId) {
    throw new Error('Competition ID required for standings report');
  }

  const competition = await prisma.competition.findUnique({
    where: { id: filters.competitionId },
    include: {
      standings: {
        orderBy: { position: 'asc' },
      },
      teams: {
        include: {
          team: { select: { name: true } },
          club: { select: { name: true } },
        },
      },
    },
  });

  if (!competition) {
    throw new Error('Competition not found');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  // Build team name lookup
  const teamNames: Record<string, string> = {};
  competition.teams.forEach(ct => {
    if (ct.teamId) {
      teamNames[ct.teamId] = ct.team?.name || ct.club.name;
    }
  });

  const sections: PDFSection[] = [
    {
      title: 'Competition Summary',
      type: 'summary',
      data: {
        'Teams': competition.teams.length,
        'Total Matches': competition.totalMatches,
        'Completed': competition.completedMatches,
        'Total Goals': competition.totalGoals,
      },
    },
    {
      title: 'League Table',
      type: 'table',
      data: {
        headers: ['Pos', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'],
        rows: competition.standings.map(s => [
          s.position,
          teamNames[s.teamId || ''] || 'TBD',
          s.played,
          s.wins,
          s.draws,
          s.losses,
          s.goalsFor,
          s.goalsAgainst,
          s.goalDifference,
          s.points,
        ]),
      },
    },
  ];

  return {
    title: competition.name,
    subtitle: `League Standings Report`,
    generatedAt: new Date(),
    generatedBy: `${user?.firstName} ${user?.lastName}`,
    sport: competition.sport,
    sections,
    metadata: {
      recordCount: competition.standings.length,
      exportType: 'standings',
      filters,
    },
  };
}

async function fetchMatchesReportData(
  userId: string,
  filters: any,
  sport?: Sport
): Promise<PDFReport> {
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
      homeClub: { select: { sport: true } },
      competition: { select: { name: true } },
    },
    orderBy: { kickOffTime: 'desc' },
    take: filters?.maxResults || MAX_RECORDS_PDF,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  // Calculate stats
  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === 'FINISHED').length;
  const totalGoals = matches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);

  const sections: PDFSection[] = [
    {
      title: 'Match Summary',
      type: 'summary',
      data: {
        'Total Matches': totalMatches,
        'Completed': completedMatches,
        'Upcoming': totalMatches - completedMatches,
        'Total Goals': totalGoals,
      },
    },
    {
      title: 'Match Results',
      type: 'table',
      data: {
        headers: ['Date', 'Home', 'Score', 'Away', 'Competition', 'Status'],
        rows: matches.map(m => [
          m.kickOffTime.toLocaleDateString(),
          m.homeTeam?.name || 'TBD',
          m.homeScore !== null ? `${m.homeScore} - ${m.awayScore}` : 'vs',
          m.awayTeam?.name || 'TBD',
          m.competition?.name || m.matchType,
          m.status,
        ]),
      },
    },
  ];

  return {
    title: 'Match Report',
    subtitle: sport ? `${sport} Matches` : 'All Matches',
    generatedAt: new Date(),
    generatedBy: `${user?.firstName} ${user?.lastName}`,
    sport,
    sections,
    metadata: {
      recordCount: totalMatches,
      exportType: 'matches',
      filters,
    },
  };
}

// ============================================================================
// POST /api/export/pdf
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
    // 5. FETCH DATA & GENERATE REPORT
    // ========================================================================

    let report: PDFReport;
    const filters = { ...input.filters, clubId: input.clubId, teamId: input.teamId, competitionId: input.competitionId };

    switch (input.exportType) {
      case 'players':
        report = await fetchPlayersReportData(user.id, filters, input.sport);
        break;
      case 'standings':
        report = await fetchStandingsReportData(user.id, filters, input.sport);
        break;
      case 'matches':
        report = await fetchMatchesReportData(user.id, filters, input.sport);
        break;
      case 'teams':
      case 'performance':
        return NextResponse.json(
          { success: false, error: { code: 'NOT_IMPLEMENTED', message: `${input.exportType} PDF export coming soon` }, requestId },
          { status: 501, headers: { 'X-Request-ID': requestId } }
        );
      default:
        throw new Error(`Unknown export type: ${input.exportType}`);
    }

    // ========================================================================
    // 6. GENERATE PDF HTML
    // ========================================================================

    const pdfHtml = generatePDFHtml(report, input.format || 'portrait');
    const htmlBytes = new TextEncoder().encode(pdfHtml);
    const filename = generateFilename(input.exportType, input.sport);

    // NOTE: In production, you would use puppeteer or similar to convert HTML to PDF
    // For this implementation, we return the HTML which can be printed/saved as PDF
    // Or use a client-side library to render it

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
          format: 'PDF',
          sport: input.sport,
          recordCount: report.metadata.recordCount,
          filename,
        },
        ipAddress: clientIp,
        requestId,
      },
    });

    const duration = Date.now() - startTime;
    console.log('[PDF_EXPORT]', {
      requestId,
      userId: user.id,
      exportType: input.exportType,
      sport: input.sport,
      recordCount: report.metadata.recordCount,
      durationMs: duration,
    });

    // ========================================================================
    // 8. RETURN PDF (as HTML for now - use puppeteer in production)
    // ========================================================================

    // For production PDF generation, replace this with puppeteer:
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(pdfHtml);
    // const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    // await browser.close();

    return new NextResponse(pdfHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=utf-8', // Change to application/pdf with puppeteer
        'Content-Disposition': `attachment; filename="${filename.replace('.pdf', '.html')}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
        'X-Record-Count': String(report.metadata.recordCount),
        'X-Processing-Time-Ms': String(duration),
        'X-PDF-Note': 'HTML output - open in browser and print to PDF, or implement server-side puppeteer rendering',
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[PDF_EXPORT_ERROR]', { requestId, error, durationMs: duration });

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
