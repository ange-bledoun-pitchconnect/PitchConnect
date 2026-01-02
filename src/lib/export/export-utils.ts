/**
 * ============================================================================
 * 🏆 PITCHCONNECT - MULTI-SPORT EXPORT UTILITIES v8.0.0
 * ============================================================================
 * Path: src/lib/export/export-utils.ts
 *
 * ENHANCEMENTS:
 * ✅ Multi-sport support (all 12 sports from Prisma schema)
 * ✅ Sport-specific column headers and data formatters
 * ✅ Dynamic scoring terminology (goals/points/runs/tries)
 * ✅ Sport-aware PDF generation
 * ✅ Enhanced CSV export with proper encoding
 * ✅ Email template generation
 * ✅ Type-safe with Prisma types
 *
 * DEPENDENCIES:
 * - jspdf: PDF generation
 * - jspdf-autotable: PDF tables
 * - papaparse: CSV parsing/generation
 * ============================================================================
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import type { Sport, Position, Player, Team, Match, PlayerStatistic } from '@prisma/client';
import { 
  getSportConfig, 
  getPositionDisplayName, 
  getRankingCategories,
  formatCurrency,
  formatDuration 
} from '@/lib/sports';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'pdf' | 'csv' | 'excel' | 'json';

export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Sport type for formatting */
  sport: Sport;
  /** Document title */
  title: string;
  /** Include headers */
  includeHeaders?: boolean;
  /** Date range for filtering */
  dateRange?: { start: Date; end: Date };
  /** Currency code */
  currency?: string;
  /** Locale for formatting */
  locale?: string;
  /** Custom filename */
  filename?: string;
}

export interface PlayerExportData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  position: Position | null;
  jerseyNumber: number | null;
  dateOfBirth?: Date | null;
  nationality?: string | null;
  stats: Partial<PlayerStatistic>;
}

export interface MatchExportData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: Date;
  venue?: string;
  competition?: string;
  sport: Sport;
}

export interface TeamExportData {
  id: string;
  name: string;
  sport: Sport;
  playerCount: number;
  wins: number;
  draws: number;
  losses: number;
  scored: number;
  conceded: number;
}

// ============================================================================
// SPORT-SPECIFIC COLUMN CONFIGURATIONS
// ============================================================================

interface ColumnConfig {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, sport: Sport) => string;
}

/**
 * Get player stat columns based on sport
 */
function getPlayerStatColumns(sport: Sport): ColumnConfig[] {
  const config = getSportConfig(sport);
  const baseColumns: ColumnConfig[] = [
    { key: 'name', header: 'Name', width: 40, align: 'left' },
    { key: 'position', header: 'Position', width: 25, align: 'center' },
    { key: 'jerseyNumber', header: '#', width: 10, align: 'center' },
    { key: 'appearances', header: 'Apps', width: 15, align: 'center' },
    { key: 'minutesPlayed', header: 'Mins', width: 15, align: 'center' },
  ];

  // Sport-specific stat columns
  const sportColumns: Record<Sport, ColumnConfig[]> = {
    FOOTBALL: [
      { key: 'goals', header: 'Goals', width: 15, align: 'center' },
      { key: 'assists', header: 'Assists', width: 15, align: 'center' },
      { key: 'cleanSheets', header: 'CS', width: 12, align: 'center' },
      { key: 'yellowCards', header: 'YC', width: 12, align: 'center' },
      { key: 'redCards', header: 'RC', width: 12, align: 'center' },
      { key: 'passAccuracy', header: 'Pass %', width: 15, align: 'center', format: (v) => v ? `${v.toFixed(1)}%` : '-' },
      { key: 'averageRating', header: 'Rating', width: 15, align: 'center', format: (v) => v ? v.toFixed(2) : '-' },
    ],
    FUTSAL: [
      { key: 'goals', header: 'Goals', width: 15, align: 'center' },
      { key: 'assists', header: 'Assists', width: 15, align: 'center' },
      { key: 'yellowCards', header: 'YC', width: 12, align: 'center' },
      { key: 'redCards', header: 'RC', width: 12, align: 'center' },
      { key: 'averageRating', header: 'Rating', width: 15, align: 'center', format: (v) => v ? v.toFixed(2) : '-' },
    ],
    BEACH_FOOTBALL: [
      { key: 'goals', header: 'Goals', width: 15, align: 'center' },
      { key: 'assists', header: 'Assists', width: 15, align: 'center' },
      { key: 'averageRating', header: 'Rating', width: 15, align: 'center', format: (v) => v ? v.toFixed(2) : '-' },
    ],
    RUGBY: [
      { key: 'goals', header: 'Tries', width: 15, align: 'center' },
      { key: 'assists', header: 'Conversions', width: 15, align: 'center' },
      { key: 'tackles', header: 'Tackles', width: 15, align: 'center' },
      { key: 'interceptions', header: 'Turnovers', width: 15, align: 'center' },
      { key: 'yellowCards', header: 'YC', width: 12, align: 'center' },
      { key: 'redCards', header: 'RC', width: 12, align: 'center' },
    ],
    BASKETBALL: [
      { key: 'goals', header: 'Points', width: 15, align: 'center' },
      { key: 'assists', header: 'Assists', width: 15, align: 'center' },
      { key: 'aerialDuelsWon', header: 'Rebounds', width: 15, align: 'center' },
      { key: 'interceptions', header: 'Steals', width: 15, align: 'center' },
      { key: 'blocks', header: 'Blocks', width: 15, align: 'center' },
      { key: 'foulsCommited', header: 'Fouls', width: 12, align: 'center' },
    ],
    CRICKET: [
      { key: 'goals', header: 'Runs', width: 15, align: 'center' },
      { key: 'assists', header: 'Wickets', width: 15, align: 'center' },
      { key: 'interceptions', header: 'Catches', width: 15, align: 'center' },
      { key: 'averageRating', header: 'Avg', width: 15, align: 'center', format: (v) => v ? v.toFixed(2) : '-' },
      { key: 'shotAccuracy', header: 'SR', width: 15, align: 'center', format: (v) => v ? v.toFixed(2) : '-' },
    ],
    AMERICAN_FOOTBALL: [
      { key: 'goals', header: 'TDs', width: 12, align: 'center' },
      { key: 'passes', header: 'Pass Yds', width: 18, align: 'center' },
      { key: 'dribbles', header: 'Rush Yds', width: 18, align: 'center' },
      { key: 'interceptions', header: 'INTs', width: 12, align: 'center' },
      { key: 'tackles', header: 'Sacks', width: 12, align: 'center' },
    ],
    NETBALL: [
      { key: 'goals', header: 'Goals', width: 15, align: 'center' },
      { key: 'shots', header: 'Attempts', width: 15, align: 'center' },
      { key: 'shotAccuracy', header: 'Acc %', width: 15, align: 'center', format: (v) => v ? `${v.toFixed(1)}%` : '-' },
      { key: 'interceptions', header: 'Intercepts', width: 15, align: 'center' },
      { key: 'passes', header: 'CPR', width: 12, align: 'center' },
    ],
    HOCKEY: [
      { key: 'goals', header: 'Goals', width: 15, align: 'center' },
      { key: 'assists', header: 'Assists', width: 15, align: 'center' },
      { key: 'saves', header: 'Saves', width: 15, align: 'center' },
      { key: 'savePercent', header: 'Sv %', width: 15, align: 'center', format: (v) => v ? `${v.toFixed(1)}%` : '-' },
      { key: 'foulsCommited', header: 'PIM', width: 12, align: 'center' },
    ],
    LACROSSE: [
      { key: 'goals', header: 'Goals', width: 15, align: 'center' },
      { key: 'assists', header: 'Assists', width: 15, align: 'center' },
      { key: 'interceptions', header: 'GBs', width: 15, align: 'center' },
      { key: 'saves', header: 'Saves', width: 15, align: 'center' },
    ],
    AUSTRALIAN_RULES: [
      { key: 'goals', header: 'Goals', width: 15, align: 'center' },
      { key: 'assists', header: 'Behinds', width: 15, align: 'center' },
      { key: 'passes', header: 'Disposals', width: 18, align: 'center' },
      { key: 'aerialDuelsWon', header: 'Marks', width: 15, align: 'center' },
      { key: 'tackles', header: 'Tackles', width: 15, align: 'center' },
    ],
    GAELIC_FOOTBALL: [
      { key: 'goals', header: 'Goals', width: 15, align: 'center' },
      { key: 'assists', header: 'Points', width: 15, align: 'center' },
      { key: 'passes', header: 'Possessions', width: 18, align: 'center' },
    ],
  };

  return [...baseColumns, ...(sportColumns[sport] || sportColumns.FOOTBALL)];
}

/**
 * Get match result columns based on sport
 */
function getMatchColumns(sport: Sport): ColumnConfig[] {
  const config = getSportConfig(sport);
  
  return [
    { key: 'date', header: 'Date', width: 25, align: 'center', format: (v) => formatDate(v) },
    { key: 'homeTeam', header: 'Home', width: 35, align: 'left' },
    { key: 'score', header: 'Score', width: 20, align: 'center' },
    { key: 'awayTeam', header: 'Away', width: 35, align: 'left' },
    { key: 'venue', header: 'Venue', width: 30, align: 'left' },
    { key: 'competition', header: 'Competition', width: 30, align: 'left' },
  ];
}

/**
 * Get standings columns based on sport
 */
function getStandingsColumns(sport: Sport): ColumnConfig[] {
  const config = getSportConfig(sport);
  const scoringLabel = config.usesGoals ? 'GF' : 'PF';
  const concededLabel = config.usesGoals ? 'GA' : 'PA';
  const diffLabel = config.usesGoals ? 'GD' : 'PD';

  return [
    { key: 'position', header: 'Pos', width: 10, align: 'center' },
    { key: 'team', header: 'Team', width: 40, align: 'left' },
    { key: 'played', header: 'P', width: 10, align: 'center' },
    { key: 'won', header: 'W', width: 10, align: 'center' },
    { key: 'drawn', header: 'D', width: 10, align: 'center' },
    { key: 'lost', header: 'L', width: 10, align: 'center' },
    { key: 'scored', header: scoringLabel, width: 12, align: 'center' },
    { key: 'conceded', header: concededLabel, width: 12, align: 'center' },
    { key: 'difference', header: diffLabel, width: 12, align: 'center', format: (v) => v > 0 ? `+${v}` : String(v) },
    { key: 'points', header: 'Pts', width: 12, align: 'center' },
  ];
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format date for export
 */
function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);
  if (format === 'long') {
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format player name
 */
function formatPlayerName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

/**
 * Format position for display
 */
function formatPosition(position: Position | null, sport: Sport): string {
  if (!position) return '-';
  return getPositionDisplayName(position, sport);
}

/**
 * Format stat value with fallback
 */
function formatStatValue(value: any, defaultValue: string = '-'): string {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return String(value);
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Generate CSV from player data
 */
export function generatePlayerCSV(
  players: PlayerExportData[],
  options: ExportOptions
): string {
  const columns = getPlayerStatColumns(options.sport);
  
  const data = players.map((player) => {
    const row: Record<string, any> = {
      name: formatPlayerName(player.firstName, player.lastName),
      position: formatPosition(player.position, options.sport),
      jerseyNumber: player.jerseyNumber ?? '-',
      appearances: player.stats.matches ?? 0,
      minutesPlayed: player.stats.minutesPlayed ?? 0,
    };

    // Add sport-specific stats
    columns.forEach((col) => {
      if (!row[col.key] && player.stats[col.key as keyof PlayerStatistic] !== undefined) {
        const value = player.stats[col.key as keyof PlayerStatistic];
        row[col.key] = col.format ? col.format(value, options.sport) : formatStatValue(value);
      }
    });

    return row;
  });

  const headers = columns.map((col) => col.header);
  const csv = Papa.unparse(data, {
    columns: columns.map((col) => col.key),
    header: options.includeHeaders !== false,
  });

  // Add BOM for Excel compatibility with UTF-8
  return '\ufeff' + csv;
}

/**
 * Generate CSV from match data
 */
export function generateMatchCSV(
  matches: MatchExportData[],
  options: ExportOptions
): string {
  const columns = getMatchColumns(options.sport);
  
  const data = matches.map((match) => ({
    date: formatDate(match.date),
    homeTeam: match.homeTeam,
    score: `${match.homeScore ?? '-'} - ${match.awayScore ?? '-'}`,
    awayTeam: match.awayTeam,
    venue: match.venue || '-',
    competition: match.competition || '-',
  }));

  const csv = Papa.unparse(data, {
    columns: columns.map((col) => col.key),
    header: options.includeHeaders !== false,
  });

  return '\ufeff' + csv;
}

/**
 * Generate CSV from standings data
 */
export function generateStandingsCSV(
  teams: TeamExportData[],
  options: ExportOptions
): string {
  const columns = getStandingsColumns(options.sport);
  
  const data = teams.map((team, index) => ({
    position: index + 1,
    team: team.name,
    played: team.wins + team.draws + team.losses,
    won: team.wins,
    drawn: team.draws,
    lost: team.losses,
    scored: team.scored,
    conceded: team.conceded,
    difference: team.scored - team.conceded,
    points: (team.wins * 3) + team.draws,
  }));

  const csv = Papa.unparse(data, {
    columns: columns.map((col) => col.key),
    header: options.includeHeaders !== false,
  });

  return '\ufeff' + csv;
}

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * Generate PDF from player data
 */
export async function generatePlayerPDF(
  players: PlayerExportData[],
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const config = getSportConfig(options.sport);
  const columns = getPlayerStatColumns(options.sport);

  // Header
  doc.setFontSize(18);
  doc.setTextColor(34, 197, 94); // Green
  doc.text(options.title || `${config.name} Player Statistics`, 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray
  doc.text(`Generated: ${formatDate(new Date(), 'long')}`, 14, 22);
  doc.text(`Sport: ${config.name}`, 14, 27);

  // Table
  const tableData = players.map((player) => {
    const row: string[] = [
      formatPlayerName(player.firstName, player.lastName),
      formatPosition(player.position, options.sport),
      String(player.jerseyNumber ?? '-'),
      String(player.stats.matches ?? 0),
      String(player.stats.minutesPlayed ?? 0),
    ];

    // Add sport-specific stats
    columns.slice(5).forEach((col) => {
      const value = player.stats[col.key as keyof PlayerStatistic];
      row.push(col.format ? col.format(value, options.sport) : formatStatValue(value));
    });

    return row;
  });

  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: tableData,
    startY: 32,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: columns.reduce((acc, col, index) => {
      acc[index] = {
        halign: col.align || 'left',
        cellWidth: col.width ? col.width * 0.7 : 'auto',
      };
      return acc;
    }, {} as Record<number, any>),
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount} | PitchConnect`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

/**
 * Generate PDF from match data
 */
export async function generateMatchPDF(
  matches: MatchExportData[],
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const config = getSportConfig(options.sport);
  const columns = getMatchColumns(options.sport);

  // Header
  doc.setFontSize(18);
  doc.setTextColor(34, 197, 94);
  doc.text(options.title || `${config.name} Match Results`, 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${formatDate(new Date(), 'long')}`, 14, 22);

  // Table
  const tableData = matches.map((match) => [
    formatDate(match.date),
    match.homeTeam,
    `${match.homeScore ?? '-'} - ${match.awayScore ?? '-'}`,
    match.awayTeam,
    match.venue || '-',
    match.competition || '-',
  ]);

  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: tableData,
    startY: 28,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  });

  return doc.output('blob');
}

/**
 * Generate PDF from standings data
 */
export async function generateStandingsPDF(
  teams: TeamExportData[],
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const config = getSportConfig(options.sport);
  const columns = getStandingsColumns(options.sport);

  // Header
  doc.setFontSize(18);
  doc.setTextColor(34, 197, 94);
  doc.text(options.title || `${config.name} League Standings`, 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${formatDate(new Date(), 'long')}`, 14, 22);

  // Table
  const tableData = teams.map((team, index) => {
    const played = team.wins + team.draws + team.losses;
    const diff = team.scored - team.conceded;
    const points = (team.wins * 3) + team.draws;

    return [
      String(index + 1),
      team.name,
      String(played),
      String(team.wins),
      String(team.draws),
      String(team.losses),
      String(team.scored),
      String(team.conceded),
      diff > 0 ? `+${diff}` : String(diff),
      String(points),
    ];
  });

  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: tableData,
    startY: 28,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 12 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'center', cellWidth: 15 },
      7: { halign: 'center', cellWidth: 15 },
      8: { halign: 'center', cellWidth: 15 },
      9: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
    },
  });

  return doc.output('blob');
}

// ============================================================================
// JSON EXPORT
// ============================================================================

/**
 * Generate JSON export
 */
export function generateJSON<T>(data: T[], options: ExportOptions): string {
  const exportData = {
    metadata: {
      title: options.title,
      sport: options.sport,
      sportName: getSportConfig(options.sport).name,
      generatedAt: new Date().toISOString(),
      recordCount: data.length,
    },
    data,
  };

  return JSON.stringify(exportData, null, 2);
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export interface EmailTemplateOptions {
  recipientName: string;
  sport: Sport;
  teamName?: string;
  subject: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * Generate HTML email template
 */
export function generateEmailTemplate(options: EmailTemplateOptions): string {
  const config = getSportConfig(options.sport);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo}); padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
          ${config.emoji} PitchConnect
        </h1>
        ${options.teamName ? `<p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${options.teamName}</p>` : ''}
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">
          Hi ${options.recipientName},
        </p>
        <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          ${options.content}
        </div>
        
        ${options.ctaText && options.ctaUrl ? `
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
          <tr>
            <td style="background-color: ${config.color}; border-radius: 8px;">
              <a href="${options.ctaUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
                ${options.ctaText}
              </a>
            </td>
          </tr>
        </table>
        ` : ''}
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
          Powered by PitchConnect - Your ${config.name} Management Platform
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          © ${new Date().getFullYear()} PitchConnect. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// FILE DOWNLOAD UTILITIES
// ============================================================================

/**
 * Trigger file download in browser
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get appropriate filename for export
 */
export function getExportFilename(
  baseName: string,
  format: ExportFormat,
  sport?: Sport
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const sportSuffix = sport ? `-${sport.toLowerCase()}` : '';
  const extension = format === 'excel' ? 'xlsx' : format;
  return `${baseName}${sportSuffix}-${timestamp}.${extension}`;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Universal export function
 */
export async function exportData<T extends PlayerExportData | MatchExportData | TeamExportData>(
  data: T[],
  dataType: 'players' | 'matches' | 'standings',
  options: ExportOptions
): Promise<string | Blob> {
  logger.info('Exporting data', {
    dataType,
    format: options.format,
    sport: options.sport,
    recordCount: data.length,
  });

  try {
    switch (options.format) {
      case 'csv':
        if (dataType === 'players') {
          return generatePlayerCSV(data as PlayerExportData[], options);
        } else if (dataType === 'matches') {
          return generateMatchCSV(data as MatchExportData[], options);
        } else {
          return generateStandingsCSV(data as TeamExportData[], options);
        }

      case 'pdf':
        if (dataType === 'players') {
          return generatePlayerPDF(data as PlayerExportData[], options);
        } else if (dataType === 'matches') {
          return generateMatchPDF(data as MatchExportData[], options);
        } else {
          return generateStandingsPDF(data as TeamExportData[], options);
        }

      case 'json':
        return generateJSON(data, options);

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    logger.error('Export failed', { dataType, format: options.format, error });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  ExportFormat,
  ExportOptions,
  PlayerExportData,
  MatchExportData,
  TeamExportData,
  EmailTemplateOptions,
};

export default {
  generatePlayerCSV,
  generateMatchCSV,
  generateStandingsCSV,
  generatePlayerPDF,
  generateMatchPDF,
  generateStandingsPDF,
  generateJSON,
  generateEmailTemplate,
  downloadFile,
  getExportFilename,
  exportData,
};