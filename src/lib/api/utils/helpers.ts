// 🎯 WORLD-CLASS API HELPERS - PRODUCTION GRADE
// Path: src/lib/api/helpers.ts
// Aligns perfectly with PitchConnect schema and existing code quality

import { prisma } from '@/lib/prisma';
import { logger } from './logger';
import { 
  BadRequestError, 
  NotFoundError, 
  ForbiddenError, 
  ConflictError, 
  InternalServerError,
  ValidationError 
} from './errors';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  sport?: string;
  league?: string;
  dateRange?: DateRange;
  [key: string]: any;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Calculate pagination offset and validate page/limit
 * @param page - Page number (1-indexed)
 * @param limit - Items per page (max 100)
 * @returns Pagination options with offset
 */
export function calculatePagination(page: number = 1, limit: number = 10): PaginationOptions {
  // Validate page
  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestError('Page must be a positive integer');
  }

  // Validate and cap limit
  if (!Number.isInteger(limit) || limit < 1) {
    throw new BadRequestError('Limit must be a positive integer');
  }

  const maxLimit = 100;
  const safeLim = Math.min(limit, maxLimit);

  return {
    page,
    limit: safeLim,
    offset: (page - 1) * safeLim,
  };
}

/**
 * Build paginated response with metadata
 * @param data - Array of items
 * @param page - Current page
 * @param limit - Items per page
 * @param total - Total count
 * @returns Paginated response structure
 */
export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// ============================================================================
// DATE & TIME HELPERS
// ============================================================================

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Birth date
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: Date | null | undefined): number {
  if (!dateOfBirth) return 0;

  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Parse ISO date string safely
 * @param dateString - ISO date string
 * @returns Parsed date or null
 */
export function parseISODate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Get date range for season (year)
 * @param year - Year number
 * @returns DateRange with season start and end
 */
export function getSeasonDateRange(year: number): DateRange {
  // Typical sports season: July 1 - June 30
  return {
    from: new Date(year, 6, 1), // July 1
    to: new Date(year + 1, 5, 30), // June 30 next year
  };
}

/**
 * Calculate days between two dates
 * @param from - Start date
 * @param to - End date
 * @returns Number of days
 */
export function daysBetween(from: Date, to: Date): number {
  const diffTime = Math.abs(to.getTime() - from.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isDateInPast(date: Date): boolean {
  return new Date(date) < new Date();
}

/**
 * Format date for display (e.g., "12 Dec 2025")
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateShort(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', options);
}

// ============================================================================
// PLAYER & TEAM HELPERS
// ============================================================================

/**
 * Get valid positions based on sport
 * @param sport - Sport type
 * @returns Array of valid positions
 */
export function getValidPositionsForSport(sport: string): string[] {
  const positionsByScore: { [key: string]: string[] } = {
    FOOTBALL: ['GK', 'CB', 'RB', 'LB', 'RWB', 'LWB', 'CM', 'CDM', 'CAM', 'RM', 'LM', 'ST', 'RW', 'LW', 'CF'],
    NETBALL: ['GK', 'GD', 'WD', 'C', 'WA', 'GA', 'S'],
    RUGBY: ['HB', 'LHP', 'HK', 'RHP', 'LLock', 'RLock', 'BL', 'BS', 'LW', 'RW', 'FH', 'SH', 'LCW', 'RCW', 'FB'],
    CRICKET: ['BAT', 'BOWLER', 'AR', 'WK'],
    BASKETBALL: ['PG', 'SG', 'SF', 'PF', 'C'],
    AMERICAN_FOOTBALL: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P'],
  };

  return positionsByScore[sport] || ['PLAYER'];
}

/**
 * Validate player position for sport
 * @param position - Position to validate
 * @param sport - Sport type
 * @returns True if position is valid
 */
export function isValidPositionForSport(position: string, sport: string): boolean {
  const validPositions = getValidPositionsForSport(sport);
  return validPositions.includes(position.toUpperCase());
}

/**
 * Get player shirt number validity range
 * @param sport - Sport type (optional)
 * @returns Min and max valid shirt numbers
 */
export function getValidShirtNumberRange(sport?: string): { min: number; max: number } {
  // Most sports use 1-99
  return { min: 1, max: 99 };
}

/**
 * Calculate player market value based on stats (simplified)
 * @param appearance - Appearances
 * @param goals - Goals scored
 * @param age - Player age
 * @returns Estimated market value in currency units
 */
export function calculatePlayerMarketValue(appearance: number, goals: number, age: number): number {
  const baseValue = 100000;
  const appearanceBonus = appearance * 5000;
  const goalBonus = goals * 50000;
  const ageMultiplier = age >= 23 && age <= 32 ? 1.2 : age > 32 ? 0.8 : 1.0;

  return Math.round((baseValue + appearanceBonus + goalBonus) * ageMultiplier);
}

// ============================================================================
// MATCH & EVENT HELPERS
// ============================================================================

/**
 * Validate match minute (0-120+)
 * @param minute - Minute to validate
 * @returns True if valid
 */
export function isValidMatchMinute(minute: number): boolean {
  return Number.isInteger(minute) && minute >= 0 && minute <= 150;
}

/**
 * Get match status from current minute
 * @param minute - Current minute
 * @param matchDuration - Total match duration (default 90)
 * @returns Match status
 */
export function getMatchStatus(minute: number, matchDuration: number = 90): string {
  if (minute === 0) return 'NOT_STARTED';
  if (minute > 0 && minute <= matchDuration) return 'IN_PROGRESS';
  if (minute > matchDuration && minute <= matchDuration + 15) return 'HALF_TIME';
  return 'COMPLETED';
}

/**
 * Calculate match time remaining
 * @param currentMinute - Current minute
 * @param totalMinutes - Total match minutes
 * @returns Minutes remaining
 */
export function getMatchTimeRemaining(currentMinute: number, totalMinutes: number = 90): number {
  return Math.max(0, totalMinutes - currentMinute);
}

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

/**
 * Calculate average rating (1-10)
 * @param ratings - Array of ratings
 * @returns Average rating or 0
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return parseFloat((sum / ratings.length).toFixed(1));
}

/**
 * Calculate passing accuracy percentage
 * @param completed - Passes completed
 * @param attempted - Passes attempted
 * @returns Accuracy percentage or 0
 */
export function calculatePassingAccuracy(completed: number, attempted: number): number {
  if (attempted === 0) return 0;
  return parseFloat(((completed / attempted) * 100).toFixed(1));
}

/**
 * Format statistics for display
 * @param stats - Statistics object
 * @returns Formatted stats
 */
export function formatPlayerStats(stats: any) {
  return {
    appearances: stats.appearances || 0,
    goals: stats.goals || 0,
    assists: stats.assists || 0,
    minutesPlayed: stats.minutesPlayed || 0,
    passingAccuracy: calculatePassingAccuracy(stats.completedPasses || 0, stats.attemptedPasses || 1),
    tackles: stats.tackles || 0,
    interceptions: stats.interceptions || 0,
    yellowCards: stats.yellowCards || 0,
    redCards: stats.redCards || 0,
    averageRating: calculateAverageRating(stats.ratings || []),
  };
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Check if user has required role
 * @param userRoles - User's roles
 * @param requiredRoles - Required roles
 * @returns True if user has at least one required role
 */
export function userHasRole(userRoles: string[] | undefined, requiredRoles: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Check if user is admin
 * @param userRoles - User's roles
 * @returns True if user is admin or super admin
 */
export function isAdmin(userRoles: string[] | undefined): boolean {
  return userHasRole(userRoles, ['SUPER_ADMIN', 'ADMIN']);
}

/**
 * Check if user is manager
 * @param userRoles - User's roles
 * @returns True if user is manager or admin
 */
export function isManager(userRoles: string[] | undefined): boolean {
  return userHasRole(userRoles, ['MANAGER', 'SUPER_ADMIN', 'ADMIN']);
}

/**
 * Check if user owns resource
 * @param userId - Current user ID
 * @param resourceOwnerId - Resource owner ID
 * @returns True if user owns resource or is admin
 */
export function userOwnsResource(userId: string, resourceOwnerId: string, isUserAdmin?: boolean): boolean {
  return userId === resourceOwnerId || isUserAdmin === true;
}

// ============================================================================
// STRING HELPERS
// ============================================================================

/**
 * Sanitize and validate email
 * @param email - Email to sanitize
 * @returns Sanitized email or null
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) return null;

  return trimmed;
}

/**
 * Truncate string to maximum length
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix if truncated (default "...")
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Generate slug from title
 * @param title - Title to slugify
 * @returns URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

/**
 * Capitalize first letter
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================================================
// NUMERIC HELPERS
// ============================================================================

/**
 * Round to specified decimal places
 * @param num - Number to round
 * @param decimals - Decimal places
 * @returns Rounded number
 */
export function roundTo(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Convert percentage to decimal
 * @param percentage - Percentage value
 * @returns Decimal value
 */
export function percentageToDecimal(percentage: number): number {
  return roundTo(percentage / 100);
}

/**
 * Format number with commas (1000 -> "1,000")
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Convert minutes to HH:MM format
 * @param totalMinutes - Total minutes
 * @returns Formatted time string
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// ============================================================================
// FILTERING HELPERS
// ============================================================================

/**
 * Build Prisma where clause from filter options
 * @param filters - Filter options
 * @returns Prisma where clause
 */
export function buildWhereClause(filters: FilterOptions): any {
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.sport) {
    where.sport = filters.sport;
  }

  if (filters.dateRange) {
    where.createdAt = {
      gte: filters.dateRange.from,
      lte: filters.dateRange.to,
    };
  }

  return where;
}

/**
 * Build Prisma orderBy clause
 * @param sort - Sort options
 * @returns Prisma orderBy clause
 */
export function buildOrderByClause(sort?: SortOptions): any {
  if (!sort) {
    return { createdAt: 'desc' };
  }

  return {
    [sort.field]: sort.direction,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate UUID format
 * @param uuid - UUID to validate
 * @returns True if valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number (basic)
 * @param phone - Phone number to validate
 * @returns True if looks valid
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validate URL
 * @param url - URL to validate
 * @returns True if valid URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

/**
 * Build standardized error response
 * @param error - Error object or message
 * @param statusCode - HTTP status code
 * @returns Error response object
 */
export function buildErrorResponse(
  error: Error | string,
  statusCode: number = 500
): {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
  timestamp: string;
} {
  const message = typeof error === 'string' ? error : error.message;
  const code = error instanceof Error && 'code' in error ? (error as any).code : undefined;

  return {
    success: false,
    error: message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Log API call with context
 * @param method - HTTP method
 * @param path - API path
 * @param userId - User ID
 * @param metadata - Additional metadata
 */
export function logAPICall(
  method: string,
  path: string,
  userId?: string,
  metadata?: any
): string {
  const requestId = crypto.randomUUID();
  const message = `[${requestId}] ${method} ${path}${userId ? ` (user: ${userId})` : ''}`;

  logger.info(message, metadata);
  return requestId;
}

/**
 * Log performance metrics
 * @param requestId - Request ID
 * @param duration - Duration in ms
 * @param metadata - Additional metadata
 */
export function logPerformance(requestId: string, duration: number, metadata?: any): void {
  const level = duration > 1000 ? 'warn' : 'info';

  logger[level as any](`[${requestId}] Performance: ${duration}ms`, metadata);
}

export default {
  calculatePagination,
  buildPaginatedResponse,
  calculateAge,
  parseISODate,
  getSeasonDateRange,
  daysBetween,
  isDateInPast,
  formatDateShort,
  getValidPositionsForSport,
  isValidPositionForSport,
  getValidShirtNumberRange,
  calculatePlayerMarketValue,
  isValidMatchMinute,
  getMatchStatus,
  getMatchTimeRemaining,
  calculateAverageRating,
  calculatePassingAccuracy,
  formatPlayerStats,
  userHasRole,
  isAdmin,
  isManager,
  userOwnsResource,
  sanitizeEmail,
  truncateString,
  generateSlug,
  capitalize,
  roundTo,
  percentageToDecimal,
  formatNumber,
  formatMinutesToTime,
  buildWhereClause,
  buildOrderByClause,
  isValidUUID,
  isValidPhoneNumber,
  isValidURL,
  buildErrorResponse,
  logAPICall,
  logPerformance,
};