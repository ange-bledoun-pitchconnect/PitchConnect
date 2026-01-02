// src/lib/validation.ts
// ============================================================================
// ZOD VALIDATION SCHEMAS - Enterprise-Grade Input Validation
// Enhanced for PitchConnect Multi-Sport Management Platform
// ============================================================================
// Complete validation for all 13 Prisma models with comprehensive coverage
// Supports ALL 12 SPORTS with sport-specific validation rules
// Used in API routes, forms, server actions, and middleware
// Full TypeScript type safety with strict schema validation
// ============================================================================

import { z } from 'zod';
import {
  Sport,
  Role,
  MatchStatus,
  MatchEventType,
  InjurySeverity,
  PlayerStatus,
  TrainingIntensity,
  AchievementCategory,
  SubscriptionTier,
} from '@prisma/client';

// ============================================================================
// ALL 12 SPORTS - Complete Position Definitions
// ============================================================================

/**
 * Complete position definitions for all 12 supported sports
 * Aligned with Prisma schema Sport enum
 */
export const SPORT_POSITIONS = {
  // Traditional Football (Soccer)
  FOOTBALL: [
    'GOALKEEPER',
    'RIGHT_BACK',
    'LEFT_BACK',
    'CENTER_BACK',
    'DEFENSIVE_MIDFIELDER',
    'CENTRAL_MIDFIELDER',
    'ATTACKING_MIDFIELDER',
    'RIGHT_WING',
    'LEFT_WING',
    'STRIKER',
    'CENTER_FORWARD',
  ],
  
  // Futsal (5-a-side)
  FUTSAL: [
    'GOALKEEPER',
    'FIXO',           // Defender
    'ALA_LEFT',       // Left winger
    'ALA_RIGHT',      // Right winger
    'PIVOT',          // Target player/forward
    'UNIVERSAL',      // Utility player
  ],
  
  // Beach Football
  BEACH_FOOTBALL: [
    'GOALKEEPER',
    'DEFENDER',
    'WINGER',
    'PIVOT',          // Central forward
  ],
  
  // Rugby Union/League
  RUGBY: [
    'LOOSEHEAD_PROP',
    'HOOKER',
    'TIGHTHEAD_PROP',
    'LOCK_4',
    'LOCK_5',
    'BLINDSIDE_FLANKER',
    'OPENSIDE_FLANKER',
    'NUMBER_8',
    'SCRUM_HALF',
    'FLY_HALF',
    'LEFT_WING',
    'INSIDE_CENTER',
    'OUTSIDE_CENTER',
    'RIGHT_WING',
    'FULLBACK',
  ],
  
  // American Football
  AMERICAN_FOOTBALL: [
    // Offense
    'QUARTERBACK',
    'RUNNING_BACK',
    'FULLBACK',
    'WIDE_RECEIVER',
    'TIGHT_END',
    'LEFT_TACKLE',
    'LEFT_GUARD',
    'CENTER',
    'RIGHT_GUARD',
    'RIGHT_TACKLE',
    // Defense
    'DEFENSIVE_END',
    'DEFENSIVE_TACKLE',
    'NOSE_TACKLE',
    'MIDDLE_LINEBACKER',
    'OUTSIDE_LINEBACKER',
    'CORNERBACK',
    'FREE_SAFETY',
    'STRONG_SAFETY',
    // Special Teams
    'KICKER',
    'PUNTER',
    'LONG_SNAPPER',
    'KICK_RETURNER',
    'PUNT_RETURNER',
  ],
  
  // Basketball
  BASKETBALL: [
    'POINT_GUARD',
    'SHOOTING_GUARD',
    'SMALL_FORWARD',
    'POWER_FORWARD',
    'CENTER',
    'GUARD',          // Combo guard
    'FORWARD',        // Combo forward
    'SWINGMAN',       // Guard-forward
  ],
  
  // Cricket
  CRICKET: [
    'OPENING_BATSMAN',
    'TOP_ORDER_BATSMAN',
    'MIDDLE_ORDER_BATSMAN',
    'LOWER_ORDER_BATSMAN',
    'WICKET_KEEPER',
    'FAST_BOWLER',
    'MEDIUM_PACE_BOWLER',
    'SPIN_BOWLER',
    'ALL_ROUNDER',
  ],
  
  // Netball
  NETBALL: [
    'GOAL_SHOOTER',
    'GOAL_ATTACK',
    'WING_ATTACK',
    'CENTER',
    'WING_DEFENSE',
    'GOAL_DEFENSE',
    'GOAL_KEEPER',
  ],
  
  // Hockey (Field Hockey)
  HOCKEY: [
    'GOALKEEPER',
    'RIGHT_BACK',
    'LEFT_BACK',
    'CENTER_BACK',
    'SWEEPER',
    'RIGHT_HALF',
    'CENTER_HALF',
    'LEFT_HALF',
    'RIGHT_WING',
    'CENTER_FORWARD',
    'LEFT_WING',
    'INSIDE_RIGHT',
    'INSIDE_LEFT',
  ],
  
  // Lacrosse
  LACROSSE: [
    'GOALKEEPER',
    'CLOSE_DEFENDER',
    'POINT_DEFENDER',
    'COVER_POINT',
    'DEFENSIVE_MIDFIELDER',
    'CENTER',
    'OFFENSIVE_MIDFIELDER',
    'FIRST_HOME',      // Attack
    'SECOND_HOME',     // Attack
    'THIRD_HOME',      // Attack
    'WING',
  ],
  
  // Australian Rules Football (AFL)
  AUSTRALIAN_RULES: [
    'FULL_BACK',
    'BACK_POCKET_LEFT',
    'BACK_POCKET_RIGHT',
    'CENTER_HALF_BACK',
    'HALF_BACK_LEFT',
    'HALF_BACK_RIGHT',
    'CENTER',
    'WING_LEFT',
    'WING_RIGHT',
    'CENTER_HALF_FORWARD',
    'HALF_FORWARD_LEFT',
    'HALF_FORWARD_RIGHT',
    'FULL_FORWARD',
    'FORWARD_POCKET_LEFT',
    'FORWARD_POCKET_RIGHT',
    'RUCK',
    'RUCK_ROVER',
    'ROVER',
    'INTERCHANGE',
  ],
  
  // Gaelic Football
  GAELIC_FOOTBALL: [
    'GOALKEEPER',
    'RIGHT_CORNER_BACK',
    'FULL_BACK',
    'LEFT_CORNER_BACK',
    'RIGHT_HALF_BACK',
    'CENTER_HALF_BACK',
    'LEFT_HALF_BACK',
    'MIDFIELDER_RIGHT',
    'MIDFIELDER_LEFT',
    'RIGHT_HALF_FORWARD',
    'CENTER_HALF_FORWARD',
    'LEFT_HALF_FORWARD',
    'RIGHT_CORNER_FORWARD',
    'FULL_FORWARD',
    'LEFT_CORNER_FORWARD',
  ],
} as const;

export type SportPosition<S extends Sport> = typeof SPORT_POSITIONS[S][number];

// ============================================================================
// SPORT-SPECIFIC VALIDATION RULES
// ============================================================================

/**
 * Sport-specific configuration for validation
 */
export const SPORT_VALIDATION_CONFIG = {
  FOOTBALL: {
    minPlayers: 7,
    maxPlayers: 11,
    matchDuration: 90,
    halfDuration: 45,
    extraTimeDuration: 30,
    maxSubstitutions: 5,
    maxSquadSize: 25,
    shirtNumberRange: { min: 1, max: 99 },
  },
  FUTSAL: {
    minPlayers: 5,
    maxPlayers: 5,
    matchDuration: 40,
    halfDuration: 20,
    extraTimeDuration: 10,
    maxSubstitutions: Infinity, // Unlimited
    maxSquadSize: 14,
    shirtNumberRange: { min: 1, max: 99 },
  },
  BEACH_FOOTBALL: {
    minPlayers: 5,
    maxPlayers: 5,
    matchDuration: 36,
    periodDuration: 12,
    periods: 3,
    maxSubstitutions: Infinity,
    maxSquadSize: 12,
    shirtNumberRange: { min: 1, max: 99 },
  },
  RUGBY: {
    minPlayers: 13,
    maxPlayers: 15,
    matchDuration: 80,
    halfDuration: 40,
    extraTimeDuration: 20,
    maxSubstitutions: 8,
    maxSquadSize: 23,
    shirtNumberRange: { min: 1, max: 99 },
  },
  AMERICAN_FOOTBALL: {
    minPlayers: 11,
    maxPlayers: 11,
    matchDuration: 60,
    quarterDuration: 15,
    quarters: 4,
    maxSubstitutions: Infinity,
    maxSquadSize: 53,
    shirtNumberRange: { min: 1, max: 99 },
  },
  BASKETBALL: {
    minPlayers: 5,
    maxPlayers: 5,
    matchDuration: 48,
    quarterDuration: 12,
    quarters: 4,
    maxSubstitutions: Infinity,
    maxSquadSize: 15,
    shirtNumberRange: { min: 0, max: 99 },
  },
  CRICKET: {
    minPlayers: 11,
    maxPlayers: 11,
    matchFormats: ['TEST', 'ODI', 'T20', 'T10'],
    maxSquadSize: 16,
    shirtNumberRange: { min: 1, max: 99 },
  },
  NETBALL: {
    minPlayers: 7,
    maxPlayers: 7,
    matchDuration: 60,
    quarterDuration: 15,
    quarters: 4,
    maxSubstitutions: Infinity,
    maxSquadSize: 12,
    shirtNumberRange: { min: 1, max: 99 },
  },
  HOCKEY: {
    minPlayers: 11,
    maxPlayers: 11,
    matchDuration: 70,
    halfDuration: 35,
    maxSubstitutions: Infinity,
    maxSquadSize: 18,
    shirtNumberRange: { min: 1, max: 99 },
  },
  LACROSSE: {
    minPlayers: 10,
    maxPlayers: 10,
    matchDuration: 60,
    quarterDuration: 15,
    quarters: 4,
    maxSubstitutions: Infinity,
    maxSquadSize: 23,
    shirtNumberRange: { min: 1, max: 99 },
  },
  AUSTRALIAN_RULES: {
    minPlayers: 18,
    maxPlayers: 18,
    matchDuration: 80,
    quarterDuration: 20,
    quarters: 4,
    interchange: 4,
    maxSquadSize: 22,
    shirtNumberRange: { min: 1, max: 99 },
  },
  GAELIC_FOOTBALL: {
    minPlayers: 15,
    maxPlayers: 15,
    matchDuration: 70,
    halfDuration: 35,
    maxSubstitutions: 6,
    maxSquadSize: 30,
    shirtNumberRange: { min: 1, max: 99 },
  },
} as const;

// ============================================================================
// UTILITY SCHEMAS & SHARED VALIDATORS
// ============================================================================

/**
 * UUID validation - Prisma default string IDs
 */
const uuidSchema = z.string().uuid('Invalid ID format').or(z.string().min(1));

/**
 * Email validation with proper standards
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim()
  .max(255, 'Email too long');

/**
 * Strong password validator
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
    'Password must contain special character'
  );

/**
 * Phone number validation (international E.164 format)
 */
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use E.164)')
  .optional()
  .or(z.literal(''));

/**
 * URL validation
 */
const urlSchema = z.string().url('Invalid URL').optional().or(z.literal(''));

/**
 * Date of birth validation (must be 13+)
 */
const dobSchema = z
  .string()
  .datetime('Invalid date format')
  .refine((date) => {
    const dob = new Date(date);
    const age = new Date().getFullYear() - dob.getFullYear();
    return age >= 13;
  }, 'Player must be at least 13 years old');

/**
 * Jersey number validation (sport-specific)
 */
const jerseyNumberSchema = (sport?: Sport) => {
  const config = sport ? SPORT_VALIDATION_CONFIG[sport] : null;
  const min = config?.shirtNumberRange?.min ?? 1;
  const max = config?.shirtNumberRange?.max ?? 99;
  
  return z
    .number()
    .int('Jersey number must be whole number')
    .min(min, `Jersey number must be at least ${min}`)
    .max(max, `Jersey number must be ${max} or less`)
    .optional();
};

/**
 * Height in cm validation (100-250cm)
 */
const heightSchema = z
  .number()
  .min(100, 'Height must be at least 100cm')
  .max(250, 'Height must be less than 250cm')
  .optional();

/**
 * Weight in kg validation (30-200kg)
 */
const weightSchema = z
  .number()
  .min(30, 'Weight must be at least 30kg')
  .max(200, 'Weight must be less than 200kg')
  .optional();

/**
 * Performance rating (0-100%)
 */
const performanceRatingSchema = z
  .number()
  .min(0, 'Rating must be 0 or higher')
  .max(100, 'Rating cannot exceed 100')
  .optional();

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => {
      const num = parseInt(val, 10);
      return Math.max(1, isNaN(num) ? 1 : num);
    }),
  limit: z
    .string()
    .default('20')
    .transform((val) => {
      const num = parseInt(val, 10);
      return Math.min(100, Math.max(1, isNaN(num) ? 20 : num));
    }),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
  search: z.string().trim().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================================
// ENUM VALIDATORS - Align with Prisma enums
// ============================================================================

export const sportEnumSchema = z.nativeEnum(Sport);
export const roleEnumSchema = z.nativeEnum(Role);
export const subscriptionTierEnumSchema = z.nativeEnum(SubscriptionTier);
export const matchStatusEnumSchema = z.nativeEnum(MatchStatus);
export const matchEventTypeEnumSchema = z.nativeEnum(MatchEventType);
export const injurySeverityEnumSchema = z.nativeEnum(InjurySeverity);
export const playerStatusEnumSchema = z.nativeEnum(PlayerStatus);
export const trainingIntensityEnumSchema = z.nativeEnum(TrainingIntensity);
export const achievementCategoryEnumSchema = z.nativeEnum(AchievementCategory);

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Login validation
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(100),
  rememberMe: z.boolean().optional().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Registration validation
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required').max(100).trim(),
    lastName: z.string().min(1, 'Last name is required').max(100).trim(),
    acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
    selectedTier: subscriptionTierEnumSchema.optional().default('PLAYER_FREE'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Password reset validation
 */
export const passwordResetSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/**
 * Password change validation (requires current password)
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/**
 * Two-factor authentication setup
 */
export const setupTwoFactorSchema = z.object({
  secret: z.string().min(20, 'Invalid secret'),
  verificationCode: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
});
export type SetupTwoFactorInput = z.infer<typeof setupTwoFactorSchema>;

/**
 * Two-factor authentication verification
 */
export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
  rememberDevice: z.boolean().optional().default(false),
});
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;

// ============================================================================
// USER SCHEMAS (User model)
// ============================================================================

/**
 * Create user validation - aligned with Prisma schema
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: phoneSchema,                              // Schema field name
  dateOfBirth: dobSchema.optional(),
  nationality: z.string().max(100).optional(),
  avatar: urlSchema,
  bio: z.string().max(1000).optional(),
  emailVerifiedAt: z.date().optional(),            // Schema field name
  twoFactorEnabled: z.boolean().optional().default(false),
  subscriptionTier: subscriptionTierEnumSchema.optional().default('PLAYER_FREE'),
  preferences: z.record(z.unknown()).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update user profile validation
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  phone: phoneSchema,                              // Schema field name
  dateOfBirth: dobSchema.optional(),
  nationality: z.string().max(100).optional(),
  avatar: urlSchema,
  bio: z.string().max(1000).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Update user role validation (admin only)
 */
export const updateUserRoleSchema = z.object({
  userId: uuidSchema,
  role: roleEnumSchema,
  teamId: uuidSchema.optional(),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/**
 * Update user preferences validation
 */
export const updateUserPreferencesSchema = z.object({
  preferences: z.record(z.unknown()),
});
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;

// ============================================================================
// LEAGUE SCHEMAS
// ============================================================================

/**
 * Create league validation
 */
export const createLeagueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200).trim(),
  description: z.string().max(2000).optional(),
  sport: sportEnumSchema,
  country: z.string().max(100).optional(),
  logo: urlSchema,
  seasonStart: z.string().datetime().optional(),
  seasonEnd: z.string().datetime().optional(),
  rules: z.record(z.unknown()).optional(),
});
export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;

/**
 * Update league validation
 */
export const updateLeagueSchema = createLeagueSchema.partial();
export type UpdateLeagueInput = z.infer<typeof updateLeagueSchema>;

// ============================================================================
// TEAM SCHEMAS
// ============================================================================

/**
 * Create team validation - multi-sport support
 */
export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(200).trim(),
  shortName: z.string().max(10).optional(),
  sport: sportEnumSchema,
  description: z.string().max(2000).optional(),
  logo: urlSchema,
  coverImage: urlSchema,
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  homeVenue: z.string().max(200).optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  website: urlSchema,
  socialLinks: z.record(z.string().url()).optional(),
  leagueId: uuidSchema.optional(),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

/**
 * Update team validation
 */
export const updateTeamSchema = createTeamSchema.partial();
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

// ============================================================================
// PLAYER SCHEMAS - Multi-Sport Support
// ============================================================================

/**
 * Create player validation with sport-specific position validation
 */
export const createPlayerSchema = z.object({
  userId: uuidSchema,
  teamId: uuidSchema,
  sport: sportEnumSchema,
  position: z.string().min(1, 'Position is required'),
  secondaryPositions: z.array(z.string()).optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional(),  // Schema field name
  status: playerStatusEnumSchema.optional().default('ACTIVE'),
  height: heightSchema,
  weight: weightSchema,
  preferredFoot: z.enum(['LEFT', 'RIGHT', 'BOTH']).optional(),
  dateOfBirth: dobSchema.optional(),
  nationality: z.string().max(100).optional(),
  contractEndDate: z.string().datetime().optional(),
  marketValue: z.number().min(0).optional(),
  attributes: z.record(z.number()).optional(),
}).refine((data) => {
  // Validate position against sport
  const validPositions = SPORT_POSITIONS[data.sport];
  if (!validPositions) return true;
  return validPositions.includes(data.position as any);
}, {
  message: 'Invalid position for selected sport',
  path: ['position'],
});
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;

/**
 * Update player validation
 */
export const updatePlayerSchema = z.object({
  position: z.string().optional(),
  secondaryPositions: z.array(z.string()).optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional(),  // Schema field name
  status: playerStatusEnumSchema.optional(),
  height: heightSchema,
  weight: weightSchema,
  preferredFoot: z.enum(['LEFT', 'RIGHT', 'BOTH']).optional(),
  contractEndDate: z.string().datetime().optional(),
  marketValue: z.number().min(0).optional(),
  attributes: z.record(z.number()).optional(),
});
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;

/**
 * Player filter validation
 */
export const playerFilterSchema = z.object({
  teamId: uuidSchema.optional(),
  sport: sportEnumSchema.optional(),
  position: z.string().optional(),
  status: playerStatusEnumSchema.optional(),
  minAge: z.number().int().min(0).optional(),
  maxAge: z.number().int().max(100).optional(),
  nationality: z.string().optional(),
  search: z.string().optional(),
});
export type PlayerFilterInput = z.infer<typeof playerFilterSchema>;

// ============================================================================
// MATCH SCHEMAS - Multi-Sport Support
// ============================================================================

/**
 * Create match validation with sport-specific rules
 */
export const createMatchSchema = z.object({
  homeTeamId: uuidSchema,
  awayTeamId: uuidSchema,
  leagueId: uuidSchema.optional(),
  sport: sportEnumSchema,
  matchDate: z.string().datetime('Invalid date format'),
  venue: z.string().max(200).optional(),
  status: matchStatusEnumSchema.optional().default('SCHEDULED'),
  competition: z.string().max(200).optional(),
  round: z.string().max(100).optional(),
  matchday: z.number().int().positive().optional(),
  referee: z.string().max(200).optional(),
  weather: z.string().max(100).optional(),
  attendance: z.number().int().min(0).optional(),
}).refine((data) => data.homeTeamId !== data.awayTeamId, {
  message: 'Home and away teams must be different',
  path: ['awayTeamId'],
});
export type CreateMatchInput = z.infer<typeof createMatchSchema>;

/**
 * Update match validation
 */
export const updateMatchSchema = z.object({
  matchDate: z.string().datetime().optional(),
  venue: z.string().max(200).optional(),
  status: matchStatusEnumSchema.optional(),
  competition: z.string().max(200).optional(),
  round: z.string().max(100).optional(),
  referee: z.string().max(200).optional(),
  weather: z.string().max(100).optional(),
  attendance: z.number().int().min(0).optional(),
});
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;

/**
 * Record match result validation - Multi-sport support
 */
export const recordMatchResultSchema = z.object({
  matchId: uuidSchema,
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  // Football/Soccer specific
  homeScoreET: z.number().int().min(0).optional(),
  awayScoreET: z.number().int().min(0).optional(),
  homePenalties: z.number().int().min(0).optional(),
  awayPenalties: z.number().int().min(0).optional(),
  // Rugby specific
  homeTries: z.number().int().min(0).optional(),
  awayTries: z.number().int().min(0).optional(),
  homeConversions: z.number().int().min(0).optional(),
  awayConversions: z.number().int().min(0).optional(),
  homePenaltyKicks: z.number().int().min(0).optional(),
  awayPenaltyKicks: z.number().int().min(0).optional(),
  homeDropGoals: z.number().int().min(0).optional(),
  awayDropGoals: z.number().int().min(0).optional(),
  // Cricket specific
  homeRuns: z.number().int().min(0).optional(),
  awayRuns: z.number().int().min(0).optional(),
  homeWickets: z.number().int().min(0).max(10).optional(),
  awayWickets: z.number().int().min(0).max(10).optional(),
  homeOvers: z.number().min(0).optional(),
  awayOvers: z.number().min(0).optional(),
  // AFL specific
  homeGoalsAFL: z.number().int().min(0).optional(),
  awayGoalsAFL: z.number().int().min(0).optional(),
  homeBehinds: z.number().int().min(0).optional(),
  awayBehinds: z.number().int().min(0).optional(),
  // General
  notes: z.string().max(2000).optional(),
  highlights: z.array(z.string().url()).optional(),
});
export type RecordMatchResultInput = z.infer<typeof recordMatchResultSchema>;

// ============================================================================
// MATCH EVENT SCHEMAS - Multi-Sport Support
// ============================================================================

/**
 * Create match event validation
 */
export const createMatchEventSchema = z.object({
  matchId: uuidSchema,
  playerId: uuidSchema.optional(),
  teamId: uuidSchema,
  eventType: matchEventTypeEnumSchema,
  minute: z.number().int().min(0),
  addedTime: z.number().int().min(0).optional(),
  period: z.number().int().min(1).optional(),
  description: z.string().max(500).optional(),
  assistPlayerId: uuidSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateMatchEventInput = z.infer<typeof createMatchEventSchema>;

/**
 * Update match event validation
 */
export const updateMatchEventSchema = z.object({
  minute: z.number().int().min(0).optional(),
  addedTime: z.number().int().min(0).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type UpdateMatchEventInput = z.infer<typeof updateMatchEventSchema>;

// ============================================================================
// TRAINING SCHEMAS
// ============================================================================

/**
 * Create training session validation
 */
export const createTrainingSessionSchema = z.object({
  teamId: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(2000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().max(200).optional(),
  intensity: trainingIntensityEnumSchema.optional().default('MEDIUM'),
  focus: z.array(z.string()).optional(),
  drills: z.array(z.object({
    name: z.string(),
    duration: z.number().int().positive(),
    description: z.string().optional(),
  })).optional(),
  notes: z.string().max(2000).optional(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});
export type CreateTrainingSessionInput = z.infer<typeof createTrainingSessionSchema>;

/**
 * Update training session validation
 */
export const updateTrainingSessionSchema = createTrainingSessionSchema.partial().omit({ teamId: true });
export type UpdateTrainingSessionInput = z.infer<typeof updateTrainingSessionSchema>;

/**
 * Record training attendance validation
 */
export const recordTrainingAttendanceSchema = z.object({
  sessionId: uuidSchema,
  attendance: z.array(z.object({
    playerId: uuidSchema,
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'INJURED']),
    notes: z.string().max(500).optional(),
    rating: z.number().min(1).max(10).optional(),
  })),
});
export type RecordTrainingAttendanceInput = z.infer<typeof recordTrainingAttendanceSchema>;

// ============================================================================
// INJURY SCHEMAS
// ============================================================================

/**
 * Create injury record validation
 */
export const createInjuryRecordSchema = z.object({
  playerId: uuidSchema,
  injuryType: z.string().min(1, 'Injury type is required').max(200),
  bodyPart: z.string().min(1, 'Body part is required').max(100),
  severity: injurySeverityEnumSchema,
  injuryDate: z.string().datetime(),
  expectedReturn: z.string().datetime().optional(),
  diagnosis: z.string().max(2000).optional(),
  treatment: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  isConfidential: z.boolean().optional().default(true),
});
export type CreateInjuryRecordInput = z.infer<typeof createInjuryRecordSchema>;

/**
 * Update injury record validation
 */
export const updateInjuryRecordSchema = z.object({
  severity: injurySeverityEnumSchema.optional(),
  expectedReturn: z.string().datetime().optional(),
  actualReturn: z.string().datetime().optional(),
  diagnosis: z.string().max(2000).optional(),
  treatment: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  isConfidential: z.boolean().optional(),
});
export type UpdateInjuryRecordInput = z.infer<typeof updateInjuryRecordSchema>;

// ============================================================================
// TACTIC SCHEMAS
// ============================================================================

/**
 * Create tactic validation
 */
export const createTacticSchema = z.object({
  teamId: uuidSchema,
  name: z.string().min(1, 'Name is required').max(200).trim(),
  sport: sportEnumSchema,
  formation: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  positions: z.record(z.object({
    playerId: uuidSchema.optional(),
    position: z.string(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    instructions: z.string().max(500).optional(),
  })).optional(),
  instructions: z.array(z.string()).optional(),
  isDefault: z.boolean().optional().default(false),
});
export type CreateTacticInput = z.infer<typeof createTacticSchema>;

/**
 * Update tactic validation
 */
export const updateTacticSchema = createTacticSchema.partial().omit({ teamId: true });
export type UpdateTacticInput = z.infer<typeof updateTacticSchema>;

// ============================================================================
// PERFORMANCE METRIC SCHEMAS
// ============================================================================

/**
 * Create performance metric validation
 */
export const createPerformanceMetricSchema = z.object({
  playerId: uuidSchema,
  matchId: uuidSchema.optional(),
  sessionId: uuidSchema.optional(),
  metricType: z.string().min(1).max(100),
  value: z.number(),
  unit: z.string().max(50).optional(),
  recordedAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});
export type CreatePerformanceMetricInput = z.infer<typeof createPerformanceMetricSchema>;

/**
 * Update performance metric validation
 */
export const updatePerformanceMetricSchema = z.object({
  value: z.number().optional(),
  notes: z.string().max(1000).optional(),
});
export type UpdatePerformanceMetricInput = z.infer<typeof updatePerformanceMetricSchema>;

// ============================================================================
// ACHIEVEMENT SCHEMAS
// ============================================================================

/**
 * Create achievement validation
 */
export const createAchievementSchema = z.object({
  playerId: uuidSchema.optional(),
  teamId: uuidSchema.optional(),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(1000).optional(),
  category: achievementCategoryEnumSchema,
  sport: sportEnumSchema,
  achievedAt: z.string().datetime(),
  season: z.string().max(20).optional(),
  competition: z.string().max(200).optional(),
  image: urlSchema,
}).refine((data) => data.playerId || data.teamId, {
  message: 'Either playerId or teamId is required',
  path: ['playerId'],
});
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;

/**
 * Update achievement validation
 */
export const updateAchievementSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).optional(),
  image: urlSchema,
});
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;

// ============================================================================
// CONTRACT SCHEMAS
// ============================================================================

/**
 * Create contract validation
 */
export const createContractSchema = z.object({
  playerId: uuidSchema,
  teamId: uuidSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  salary: z.number().min(0).optional(),
  currency: z.string().length(3).optional().default('GBP'),
  bonuses: z.record(z.number()).optional(),
  releaseClause: z.number().min(0).optional(),
  terms: z.string().max(5000).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'TERMINATED']).default('ACTIVE'),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});
export type CreateContractInput = z.infer<typeof createContractSchema>;

/**
 * Update contract validation
 */
export const updateContractSchema = z.object({
  endDate: z.string().datetime().optional(),
  salary: z.number().min(0).optional(),
  bonuses: z.record(z.number()).optional(),
  releaseClause: z.number().min(0).optional(),
  terms: z.string().max(5000).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'TERMINATED']).optional(),
});
export type UpdateContractInput = z.infer<typeof updateContractSchema>;

// ============================================================================
// PLAYER STAT SCHEMAS
// ============================================================================

/**
 * Player stat validation (match-specific statistics)
 */
export const playerStatSchema = z.object({
  playerId: uuidSchema,
  matchId: uuidSchema,
  teamId: uuidSchema,
  sport: sportEnumSchema,
  minutesPlayed: z.number().int().min(0).optional(),
  // Common stats
  goals: z.number().int().min(0).optional(),
  assists: z.number().int().min(0).optional(),
  // Sport-specific stats (stored as JSON)
  stats: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  rating: z.number().min(0).max(10).optional(),
});
export type PlayerStatInput = z.infer<typeof playerStatSchema>;

// ============================================================================
// HELPER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate pagination parameters
 */
export function parsePaginationParams(
  page?: string | number,
  limit?: string | number
) {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page || 1;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit || 20;

  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)),
  };
}

/**
 * Validate ID format
 */
export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
  isStrong: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return {
    isStrong: errors.length === 0,
    errors,
  };
}

/**
 * Validate date of birth (must be 13+)
 */
export function isValidDateOfBirth(dob: string): {
  isValid: boolean;
  age?: number;
  error?: string;
} {
  try {
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const month = today.getMonth() - dobDate.getMonth();

    if (month < 0 || (month === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 13) {
      return { isValid: false, error: 'Player must be at least 13 years old' };
    }

    if (age > 100) {
      return { isValid: false, error: 'Age seems invalid' };
    }

    return { isValid: true, age };
  } catch {
    return { isValid: false, error: 'Invalid date format' };
  }
}

/**
 * Get valid positions for a specific sport
 */
export function getValidPositionsForSport(sport: Sport): readonly string[] {
  return SPORT_POSITIONS[sport] || [];
}

/**
 * Validate player position for a specific sport
 */
export function isValidPositionForSport(position: string, sport: Sport): boolean {
  const validPositions = SPORT_POSITIONS[sport];
  if (!validPositions) return false;
  return validPositions.includes(position as any);
}

/**
 * Get sport validation configuration
 */
export function getSportConfig(sport: Sport) {
  return SPORT_VALIDATION_CONFIG[sport];
}

/**
 * Calculate player age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validate match result scores based on sport
 */
export function validateMatchResult(
  sport: Sport,
  result: {
    homeScore: number;
    awayScore: number;
    homeScoreET?: number;
    awayScoreET?: number;
    homePenalties?: number;
    awayPenalties?: number;
  }
): { isValid: boolean; error?: string } {
  if (result.homeScore < 0 || result.awayScore < 0) {
    return { isValid: false, error: 'Scores cannot be negative' };
  }

  // Sport-specific validation
  if (sport === 'FOOTBALL' || sport === 'FUTSAL' || sport === 'BEACH_FOOTBALL') {
    const homeET = (result.homeScoreET || 0) + result.homeScore;
    const awayET = (result.awayScoreET || 0) + result.awayScore;

    if (result.homePenalties !== undefined || result.awayPenalties !== undefined) {
      if (homeET !== awayET) {
        return {
          isValid: false,
          error: 'Penalties can only be used when match is tied after extra time',
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validate squad size for a sport
 */
export function validateSquadSize(sport: Sport, playerCount: number): { isValid: boolean; error?: string } {
  const config = SPORT_VALIDATION_CONFIG[sport];
  if (!config) return { isValid: true };
  
  if (playerCount > config.maxSquadSize) {
    return {
      isValid: false,
      error: `Squad size exceeds maximum of ${config.maxSquadSize} for ${sport}`,
    };
  }
  
  return { isValid: true };
}

/**
 * Validate lineup for a sport
 */
export function validateLineup(sport: Sport, playerCount: number): { isValid: boolean; error?: string } {
  const config = SPORT_VALIDATION_CONFIG[sport];
  if (!config) return { isValid: true };
  
  if (playerCount < config.minPlayers) {
    return {
      isValid: false,
      error: `Lineup requires at least ${config.minPlayers} players for ${sport}`,
    };
  }
  
  if (playerCount > config.maxPlayers) {
    return {
      isValid: false,
      error: `Lineup cannot exceed ${config.maxPlayers} players for ${sport}`,
    };
  }
  
  return { isValid: true };
}

// ============================================================================
// EXPORT ALL SCHEMAS & TYPES
// ============================================================================

export default {
  // Constants
  SPORT_POSITIONS,
  SPORT_VALIDATION_CONFIG,
  
  // Pagination
  paginationSchema,
  parsePaginationParams,

  // Authentication
  loginSchema,
  registerSchema,
  passwordResetSchema,
  passwordChangeSchema,
  setupTwoFactorSchema,
  verifyTwoFactorSchema,

  // User
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserPreferencesSchema,

  // League
  createLeagueSchema,
  updateLeagueSchema,

  // Team
  createTeamSchema,
  updateTeamSchema,

  // Player
  createPlayerSchema,
  updatePlayerSchema,
  playerFilterSchema,

  // Match
  createMatchSchema,
  updateMatchSchema,
  recordMatchResultSchema,

  // Match Event
  createMatchEventSchema,
  updateMatchEventSchema,

  // Player Stat
  playerStatSchema,

  // Training
  createTrainingSessionSchema,
  updateTrainingSessionSchema,
  recordTrainingAttendanceSchema,

  // Injury
  createInjuryRecordSchema,
  updateInjuryRecordSchema,

  // Tactic
  createTacticSchema,
  updateTacticSchema,

  // Performance Metric
  createPerformanceMetricSchema,
  updatePerformanceMetricSchema,

  // Achievement
  createAchievementSchema,
  updateAchievementSchema,

  // Contract
  createContractSchema,
  updateContractSchema,

  // Validators
  isValidId,
  isValidEmail,
  isStrongPassword,
  isValidDateOfBirth,
  getValidPositionsForSport,
  isValidPositionForSport,
  getSportConfig,
  calculateAge,
  validateMatchResult,
  validateSquadSize,
  validateLineup,
};