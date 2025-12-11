import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

/**
 * Export Utilities Module
 * Path: src/lib/export/export-utils.ts
 * 
 * Provides utilities for:
 * - PDF generation (jsPDF + html2canvas)
 * - CSV formatting and generation
 * - Email template generation
 * - File naming with timestamps
 * - Date and format helpers
 */

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'pdf' | 'csv' | 'email';
export type FileType = 'players' | 'teams' | 'standings' | 'matches' | 'custom';

export interface ExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

export interface CSVRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  html: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PDF_DEFAULTS = {
  orientation: 'portrait' as const,
  unit: 'mm' as const,
  format: 'a4' as const,
  margins: { top: 15, right: 15, bottom: 15, left: 15 },
};

const COLOR_PRIMARY = [33, 128, 141]; // Teal-500
const COLOR_SECONDARY = [94, 82, 64]; // Brown-600
const COLOR_HEADER = [31, 33, 33]; // Charcoal-700
const COLOR_TEXT = [19, 52, 59]; // Slate-900
const COLOR_BORDER = [167, 169, 169]; // Gray-300
const COLOR_SUCCESS = [33, 128, 141]; // Green
const COLOR_WARNING = [230, 129, 97]; // Orange

// ============================================================================
// PDF UTILITIES
// ============================================================================

/**
 * Generate PDF from HTML element
 * @param element HTML element to convert
 * @param options PDF options
 * @returns Promise<jsPDF>
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<jsPDF> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4',
    });

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth - 20, imgHeight);

    return pdf;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Create a formatted PDF document
 * @param title Document title
 * @param subtitle Document subtitle
 * @param data Table data array
 * @param options PDF options
 * @returns Promise<jsPDF>
 */
export async function createFormattedPDF(
  title: string,
  subtitle: string,
  data: CSVRow[],
  options: ExportOptions = {}
): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: options.format || 'a4',
  });

  let yPosition = PDF_DEFAULTS.margins.top;

  // Add header
  pdf.setFontSize(20);
  pdf.setTextColor(...COLOR_HEADER);
  pdf.text(title, PDF_DEFAULTS.margins.left, yPosition);
  yPosition += 10;

  // Add subtitle
  pdf.setFontSize(12);
  pdf.setTextColor(...COLOR_SECONDARY);
  pdf.text(subtitle, PDF_DEFAULTS.margins.left, yPosition);
  yPosition += 8;

  // Add timestamp
  pdf.setFontSize(10);
  pdf.setTextColor(...COLOR_TEXT);
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  pdf.text(`Generated: ${timestamp}`, PDF_DEFAULTS.margins.left, yPosition);
  yPosition += 8;

  // Add separator
  pdf.setDrawColor(...COLOR_BORDER);
  pdf.line(
    PDF_DEFAULTS.margins.left,
    yPosition,
    210 - PDF_DEFAULTS.margins.right,
    yPosition
  );
  yPosition += 5;

  // Add table
  if (data.length > 0) {
    const columns = Object.keys(data);
    const rows = data.map((row) => columns.map((col) => String(row[col] || '')));

    // Table setup
    const pageHeight = pdf.internal.pageSize.getHeight();
    const tableStartY = yPosition;
    const rowHeight = 7;
    const columnWidth = (210 - 30) / columns.length;

    // Header row
    pdf.setFillColor(...COLOR_PRIMARY);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');

    columns.forEach((col, i) => {
      pdf.rect(
        PDF_DEFAULTS.margins.left + i * columnWidth,
        tableStartY,
        columnWidth,
        rowHeight,
        'F'
      );
      pdf.text(
        col.toUpperCase(),
        PDF_DEFAULTS.margins.left + i * columnWidth + 1,
        tableStartY + 5
      );
    });

    // Data rows
    pdf.setTextColor(...COLOR_TEXT);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);

    rows.forEach((row, rowIndex) => {
      const currentY = tableStartY + (rowIndex + 1) * rowHeight;

      // Check if we need a new page
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        yPosition = PDF_DEFAULTS.margins.top;
      }

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(
          PDF_DEFAULTS.margins.left,
          currentY,
          210 - 30,
          rowHeight,
          'F'
        );
      }

      row.forEach((cell, colIndex) => {
        pdf.text(
          cell,
          PDF_DEFAULTS.margins.left + colIndex * columnWidth + 1,
          currentY + 5
        );
      });
    });
  }

  // Add footer
  const pageCount = pdf.getNumberOfPages();
  pdf.setFontSize(8);
  pdf.setTextColor(...COLOR_TEXT);
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      210 / 2,
      pdf.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  return pdf;
}

/**
 * Save PDF to file
 * @param pdf jsPDF instance
 * @param filename Filename
 */
export function savePDF(pdf: jsPDF, filename: string): void {
  pdf.save(`${filename}.pdf`);
}

// ============================================================================
// CSV UTILITIES
// ============================================================================

/**
 * Convert data to CSV string
 * @param data Array of objects
 * @param filename Filename for output
 * @returns CSV string
 */
export function generateCSV(data: CSVRow[], filename?: string): string {
  try {
    const csv = Papa.unparse(data, {
      header: true,
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
    });
    return csv;
  } catch (error) {
    console.error('CSV generation error:', error);
    throw new Error('Failed to generate CSV');
  }
}

/**
 * Save CSV to file
 * @param csvContent CSV string content
 * @param filename Filename without extension
 */
export function saveCSV(csvContent: string, filename: string): void {
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('CSV save error:', error);
    throw new Error('Failed to save CSV file');
  }
}

/**
 * Parse CSV string to array of objects
 * @param csvContent CSV string
 * @returns Array of objects
 */
export function parseCSV(csvContent: string): CSVRow[] {
  try {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });
    return result.data as CSVRow[];
  } catch (error) {
    console.error('CSV parse error:', error);
    throw new Error('Failed to parse CSV');
  }
}

// ============================================================================
// EMAIL UTILITIES
// ============================================================================

/**
 * Generate email template for report delivery
 * @param fileType Type of file/report
 * @param filename Filename
 * @param message Optional custom message
 * @returns EmailTemplate object
 */
export function generateEmailTemplate(
  fileType: FileType,
  filename: string,
  message?: string
): EmailTemplate {
  const fileTypeLabels: Record<FileType, string> = {
    players: 'Player Statistics Report',
    teams: 'Team Standings Report',
    standings: 'League Standings Report',
    matches: 'Match Results Report',
    custom: 'Custom Report',
  };

  const label = fileTypeLabels[fileType];

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #216580 0%, #e6819a 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content p { margin: 10px 0; line-height: 1.6; }
          .footer { color: #666; font-size: 12px; text-align: center; }
          .cta { display: inline-block; background: #216580; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${label}</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>Your requested ${label.toLowerCase()} has been generated and is ready for download.</p>
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            <p><strong>File:</strong> ${filename}</p>
            <p>This report contains the latest information from PitchConnect sports management system.</p>
          </div>
          <div class="footer">
            <p>Generated by PitchConnect © ${new Date().getFullYear()}</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    subject: `PitchConnect: ${label}`,
    body: `Your ${label.toLowerCase()} has been generated. File: ${filename}`,
    html: htmlBody,
  };
}

// ============================================================================
// FILE NAMING UTILITIES
// ============================================================================

/**
 * Generate filename with timestamp
 * @param fileType Type of file
 * @param extension File extension
 * @returns Filename with timestamp
 */
export function generateFilename(
  fileType: FileType,
  extension: 'pdf' | 'csv' = 'pdf'
): string {
  const timestamp = new Date()
    .toISOString()
    .split('T')
    .replace(/-/g, '');
  const time = new Date().toTimeString().split(' ').replace(/:/g, '');

  const fileTypeNames: Record<FileType, string> = {
    players: 'PlayerStatistics',
    teams: 'TeamStandings',
    standings: 'LeagueTable',
    matches: 'MatchResults',
    custom: 'Report',
  };

  const name = fileTypeNames[fileType];
  return `${name}_${timestamp}_${time}.${extension}`;
}

/**
 * Generate human-readable timestamp
 * @returns Formatted timestamp string
 */
export function getFormattedTimestamp(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// DATA FORMATTING UTILITIES
// ============================================================================

/**
 * Format player data for export
 * @param players Player array
 * @returns Formatted CSV rows
 */
export function formatPlayerData(
  players: any[]
): CSVRow[] {
  return players.map((player) => ({
    'Player Name': player.name || '',
    'Jersey Number': player.jerseyNumber || '',
    'Position': player.position || '',
    'Club': player.club?.name || '',
    'Date of Birth': player.dateOfBirth
      ? new Date(player.dateOfBirth).toLocaleDateString()
      : '',
    'Nationality': player.nationality || '',
    'Rating': player.rating || 0,
    'Appearances': player.appearances || 0,
    'Goals': player.goals || 0,
    'Assists': player.assists || 0,
    'Yellow Cards': player.yellowCards || 0,
    'Red Cards': player.redCards || 0,
  }));
}

/**
 * Format team data for export
 * @param teams Team array
 * @returns Formatted CSV rows
 */
export function formatTeamData(teams: any[]): CSVRow[] {
  return teams.map((team) => ({
    'Team Name': team.name || '',
    'Short Name': team.shortName || '',
    'League': team.league?.name || '',
    'Manager': team.manager?.name || '',
    'Stadium': team.stadium || '',
    'City': team.city || '',
    'Players': team.players?.length || 0,
    'Founded': team.founded || '',
    'Status': team.status || 'active',
  }));
}

/**
 * Format standings data for export
 * @param standings Standings array
 * @returns Formatted CSV rows
 */
export function formatStandingsData(standings: any[]): CSVRow[] {
  return standings.map((entry, index) => ({
    'Position': index + 1,
    'Team': entry.club?.name || '',
    'Played': entry.played || 0,
    'Won': entry.won || 0,
    'Drawn': entry.drawn || 0,
    'Lost': entry.lost || 0,
    'Goals For': entry.goalsFor || 0,
    'Goals Against': entry.goalsAgainst || 0,
    'Goal Difference': (entry.goalsFor || 0) - (entry.goalsAgainst || 0),
    'Points': entry.points || 0,
  }));
}

/**
 * Format match data for export
 * @param matches Match array
 * @returns Formatted CSV rows
 */
export function formatMatchData(matches: any[]): CSVRow[] {
  return matches.map((match) => ({
    'Date': match.date ? new Date(match.date).toLocaleDateString() : '',
    'Home Team': match.homeClub?.name || '',
    'Away Team': match.awayClub?.name || '',
    'Score': `${match.homeScore || 0}-${match.awayScore || 0}`,
    'Status': match.status || 'scheduled',
    'Venue': match.venue || '',
    'Attendance': match.attendance || '',
    'Referee': match.referee?.name || '',
    'Round': match.round || '',
    'League': match.league?.name || '',
  }));
}

// ============================================================================
// EXPORT DISPLAY NAME
// ============================================================================

export const exportUtils = {
  generatePDFFromHTML,
  createFormattedPDF,
  savePDF,
  generateCSV,
  saveCSV,
  parseCSV,
  generateEmailTemplate,
  generateFilename,
  getFormattedTimestamp,
  formatFileSize,
  formatPlayerData,
  formatTeamData,
  formatStandingsData,
  formatMatchData,
};
