// src/lib/validation.ts
// ============================================================================
// ZOD VALIDATION SCHEMAS - Enterprise-Grade Input Validation
// Enhanced for PitchConnect Multi-Sport Management Platform
// ============================================================================
// Complete validation for all 13 Prisma models with comprehensive coverage
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
} from '@prisma/client';

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
 * Phone number validation (international)
 */
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
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
 * Shirt number validation (1-99)
 */
const shirtNumberSchema = z
  .number()
  .int('Shirt number must be whole number')
  .min(1, 'Shirt number must be at least 1')
  .max(99, 'Shirt number must be less than 100')
  .optional();

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
const paginationSchema = z.object({
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
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100),
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
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name too long')
      .trim(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name too long')
      .trim(),
    acceptTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        'You must accept the terms and conditions'
      ),
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
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
  rememberDevice: z.boolean().optional().default(false),
});
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;

// ============================================================================
// USER SCHEMAS (User model)
// ============================================================================

/**
 * Create user validation
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  role: roleEnumSchema.default('USER'),
  phoneNumber: phoneSchema,
  dateOfBirth: dobSchema.optional(),
  nationality: z.string().max(100).optional(),
  avatar: urlSchema,
  bio: z.string().max(1000).optional(),
  emailVerified: z.date().optional(),
  twoFactorEnabled: z.boolean().optional().default(false),
  preferences: z.record(z.unknown()).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update user profile validation
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  phoneNumber: phoneSchema,
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
  role: roleEnumSchema,
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/**
 * User preferences validation
 */
export const updateUserPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});
export type UpdateUserPreferencesInput = z.infer<
  typeof updateUserPreferencesSchema
>;

// ============================================================================
// LEAGUE SCHEMAS (League model)
// ============================================================================

/**
 * Create league validation
 */
export const createLeagueSchema = z.object({
  name: z
    .string()
    .min(2, 'League name must be at least 2 characters')
    .max(255)
    .trim(),
  code: z
    .string()
    .min(2, 'League code must be at least 2 characters')
    .max(10)
    .toUpperCase()
    .trim(),
  sport: sportEnumSchema,
  season: z.string().regex(/^\d{4}-\d{4}$/, 'Season format must be YYYY-YYYY'),
  description: z.string().max(2000).optional(),
  logoUrl: urlSchema,
  country: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  ageGroup: z.string().max(100).optional(),
  division: z.string().max(100).optional(),
});
export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;

/**
 * Update league validation
 */
export const updateLeagueSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  description: z.string().max(2000).optional(),
  logoUrl: urlSchema,
  season: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Season format must be YYYY-YYYY')
    .optional(),
});
export type UpdateLeagueInput = z.infer<typeof updateLeagueSchema>;

// ============================================================================
// TEAM SCHEMAS (Team model)
// ============================================================================

/**
 * Create team validation
 */
export const createTeamSchema = z.object({
  leagueId: uuidSchema,
  name: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(255)
    .trim(),
  code: z
    .string()
    .min(2, 'Team code must be at least 2 characters')
    .max(10)
    .toUpperCase()
    .trim(),
  description: z.string().max(2000).optional(),
  logoUrl: urlSchema,
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color code').optional(),
  homeStadium: z.string().max(255).optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  website: urlSchema,
  socialMedia: z
    .object({
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
});
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

/**
 * Update team validation
 */
export const updateTeamSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  description: z.string().max(2000).optional(),
  logoUrl: urlSchema,
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color code').optional(),
  homeStadium: z.string().max(255).optional(),
  website: urlSchema,
});
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

// ============================================================================
// PLAYER SCHEMAS (Player model)
// ============================================================================

/**
 * Position enum for football (can be extended per sport)
 */
const positionEnumSchema = z.enum([
  // Football positions
  'GOALKEEPER',
  'DEFENDER',
  'MIDFIELDER',
  'FORWARD',
  // Netball positions
  'GOAL_SHOOTER',
  'GOAL_ATTACK',
  'WING_ATTACK',
  'CENTER',
  'WING_DEFENSE',
  'GOAL_DEFENSE',
  'GOALKEEPER_NETBALL',
  // Additional positions for other sports
  'PITCHER',
  'CATCHER',
  'BATTER',
  'FIELDER',
  'BATSMAN',
  'BOWLER',
  'WICKET_KEEPER',
  'FIELDER_CRICKET',
  'QUARTERBACK',
  'RUNNING_BACK',
  'WIDE_RECEIVER',
  'TIGHT_END',
  'OFFENSIVE_LINEMAN',
  'DEFENSIVE_LINEMAN',
  'LINEBACKER',
  'CORNERBACK',
  'SAFETY',
  'KICKER',
  'POINT_GUARD',
  'SHOOTING_GUARD',
  'SMALL_FORWARD',
  'POWER_FORWARD',
  'CENTER_BASKETBALL',
]);

const preferredFootEnumSchema = z.enum(['LEFT', 'RIGHT', 'BOTH']);

/**
 * Create player validation
 */
export const createPlayerSchema = z.object({
  teamId: uuidSchema,
  userId: uuidSchema.optional(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100)
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100)
    .trim(),
  email: emailSchema.optional(),
  dateOfBirth: dobSchema,
  nationality: z.string().max(100).optional(),
  position: positionEnumSchema,
  secondaryPosition: positionEnumSchema.optional(),
  preferredFoot: preferredFootEnumSchema.optional(),
  height: heightSchema,
  weight: weightSchema,
  shirtNumber: shirtNumberSchema,
  photo: urlSchema,
  passportUrl: urlSchema,
  status: playerStatusEnumSchema.default('ACTIVE'),
  bio: z.string().max(1000).optional(),
  socialMedia: z
    .object({
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
    })
    .optional(),
});
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;

/**
 * Update player validation
 */
export const updatePlayerSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  position: positionEnumSchema.optional(),
  secondaryPosition: positionEnumSchema.optional(),
  preferredFoot: preferredFootEnumSchema.optional(),
  height: heightSchema,
  weight: weightSchema,
  shirtNumber: shirtNumberSchema,
  photo: urlSchema,
  status: playerStatusEnumSchema.optional(),
  bio: z.string().max(1000).optional(),
});
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;

/**
 * Player filter validation
 */
export const playerFilterSchema = z.object({
  status: playerStatusEnumSchema.optional(),
  position: positionEnumSchema.optional(),
  minAge: z.number().min(13).optional(),
  maxAge: z.number().max(50).optional(),
  search: z.string().trim().optional(),
  sortBy: z
    .enum(['name', 'shirtNumber', 'age', 'position'])
    .optional(),
});
export type PlayerFilterInput = z.infer<typeof playerFilterSchema>;

// ============================================================================
// MATCH SCHEMAS (Match model)
// ============================================================================

/**
 * Create match validation
 */
export const createMatchSchema = z.object({
  leagueId: uuidSchema,
  homeTeamId: uuidSchema,
  awayTeamId: uuidSchema,
  scheduledDate: z.string().datetime('Invalid date format'),
  venue: z.string().max(255).optional(),
  venueCity: z.string().max(100).optional(),
  venueCountry: z.string().max(100).optional(),
  referee: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateMatchInput = z.infer<typeof createMatchSchema>;

/**
 * Update match validation
 */
export const updateMatchSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  venue: z.string().max(255).optional(),
  venueCity: z.string().max(100).optional(),
  status: matchStatusEnumSchema.optional(),
  homeGoals: z.number().min(0).max(999).optional(),
  awayGoals: z.number().min(0).max(999).optional(),
  homeGoalsET: z.number().min(0).max(999).optional(),
  awayGoalsET: z.number().min(0).max(999).optional(),
  homePenalties: z.number().min(0).max(999).optional(),
  awayPenalties: z.number().min(0).max(999).optional(),
  attendance: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;

/**
 * Record match result validation
 */
export const recordMatchResultSchema = z
  .object({
    homeGoals: z.number().min(0, 'Goals cannot be negative').max(999),
    awayGoals: z.number().min(0, 'Goals cannot be negative').max(999),
    homeGoalsET: z.number().min(0).max(999).optional(),
    awayGoalsET: z.number().min(0).max(999).optional(),
    homePenalties: z.number().min(0).max(999).optional(),
    awayPenalties: z.number().min(0).max(999).optional(),
    attendance: z.number().min(0).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (data) => {
      // If penalties are recorded, match must be tied after ET
      if (
        (data.homePenalties || 0) > 0 ||
        (data.awayPenalties || 0) > 0
      ) {
        const homeET = (data.homeGoals || 0) + (data.homeGoalsET || 0);
        const awayET = (data.awayGoals || 0) + (data.awayGoalsET || 0);
        return homeET === awayET;
      }
      return true;
    },
    {
      message: 'Penalties can only be used in tied matches',
      path: ['homePenalties'],
    }
  );
export type RecordMatchResultInput = z.infer<typeof recordMatchResultSchema>;

// ============================================================================
// MATCH EVENT SCHEMAS (MatchEvent model)
// ============================================================================

/**
 * Create match event validation
 */
export const createMatchEventSchema = z.object({
  matchId: uuidSchema,
  playerId: uuidSchema,
  eventType: matchEventTypeEnumSchema,
  minute: z.number().min(0).max(200, 'Invalid match minute'),
  extraTime: z.boolean().optional().default(false),
  isPenalty: z.boolean().optional().default(false),
  isOwnGoal: z.boolean().optional().default(false),
  description: z.string().max(500).optional(),
  relatedPlayerId: uuidSchema.optional(), // For assists, etc.
});
export type CreateMatchEventInput = z.infer<typeof createMatchEventSchema>;

/**
 * Update match event validation
 */
export const updateMatchEventSchema = z.object({
  minute: z.number().min(0).max(200).optional(),
  extraTime: z.boolean().optional(),
  isPenalty: z.boolean().optional(),
  isOwnGoal: z.boolean().optional(),
  description: z.string().max(500).optional(),
});
export type UpdateMatchEventInput = z.infer<typeof updateMatchEventSchema>;

// ============================================================================
// PLAYER STAT SCHEMAS (PlayerStat model)
// ============================================================================

/**
 * Create/update player stat validation
 */
export const playerStatSchema = z.object({
  playerId: uuidSchema,
  matchId: uuidSchema.optional(),
  goals: z.number().min(0).max(99).optional().default(0),
  assists: z.number().min(0).max(99).optional().default(0),
  minutes: z.number().min(0).max(999).optional().default(0),
  possession: z.number().min(0).max(100).optional(),
  passAccuracy: z.number().min(0).max(100).optional(),
  tackles: z.number().min(0).max(99).optional().default(0),
  interceptions: z.number().min(0).max(99).optional().default(0),
  fouls: z.number().min(0).max(99).optional().default(0),
  yellowCards: z.number().min(0).max(2).optional().default(0),
  redCards: z.boolean().optional().default(false),
  rating: performanceRatingSchema,
  notes: z.string().max(500).optional(),
});
export type PlayerStatInput = z.infer<typeof playerStatSchema>;

// ============================================================================
// TRAINING SESSION SCHEMAS (TrainingSession model)
// ============================================================================

/**
 * Create training session validation
 */
export const createTrainingSessionSchema = z.object({
  teamId: uuidSchema,
  date: z.string().datetime('Invalid date format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  location: z.string().max(255).optional(),
  focus: z.string().max(500),
  intensity: trainingIntensityEnumSchema.optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateTrainingSessionInput = z.infer<
  typeof createTrainingSessionSchema
>;

/**
 * Update training session validation
 */
export const updateTrainingSessionSchema = z.object({
  date: z.string().datetime().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  location: z.string().max(255).optional(),
  focus: z.string().max(500).optional(),
  intensity: trainingIntensityEnumSchema.optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdateTrainingSessionInput = z.infer<
  typeof updateTrainingSessionSchema
>;

/**
 * Record training attendance validation
 */
export const recordTrainingAttendanceSchema = z.object({
  playerId: uuidSchema,
  trainingSessionId: uuidSchema,
  status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'LEFT_EARLY']),
  performanceRating: performanceRatingSchema,
  notes: z.string().max(500).optional(),
});
export type RecordTrainingAttendanceInput = z.infer<
  typeof recordTrainingAttendanceSchema
>;

// ============================================================================
// INJURY RECORD SCHEMAS (InjuryRecord model)
// ============================================================================

/**
 * Create injury record validation
 */
export const createInjuryRecordSchema = z.object({
  playerId: uuidSchema,
  injuryType: z.string().max(100),
  bodyPart: z.string().max(100),
  severity: injurySeverityEnumSchema,
  dateOccurred: z.string().datetime('Invalid date format'),
  description: z.string().max(2000).optional(),
  medicalNotes: z.string().max(2000).optional(),
  recoveryStatus: z.enum(['ACTIVE', 'RECOVERING', 'RECOVERED']).default('ACTIVE'),
  estimatedReturnDate: z.string().datetime().optional(),
  actuallReturnDate: z.string().datetime().optional(),
});
export type CreateInjuryRecordInput = z.infer<typeof createInjuryRecordSchema>;

/**
 * Update injury record validation
 */
export const updateInjuryRecordSchema = z.object({
  injuryType: z.string().max(100).optional(),
  bodyPart: z.string().max(100).optional(),
  severity: injurySeverityEnumSchema.optional(),
  description: z.string().max(2000).optional(),
  medicalNotes: z.string().max(2000).optional(),
  recoveryStatus: z.enum(['ACTIVE', 'RECOVERING', 'RECOVERED']).optional(),
  estimatedReturnDate: z.string().datetime().optional(),
  actualReturnDate: z.string().datetime().optional(),
});
export type UpdateInjuryRecordInput = z.infer<typeof updateInjuryRecordSchema>;

// ============================================================================
// TACTIC SCHEMAS (Tactic model)
// ============================================================================

const formationEnumSchema = z.enum([
  'FOUR_FOUR_TWO',
  'FOUR_THREE_THREE',
  'THREE_FIVE_TWO',
  'FIVE_THREE_TWO',
  'FIVE_FOUR_ONE',
  'THREE_FOUR_THREE',
  'FOUR_TWO_THREE_ONE',
  'FOUR_ONE_FOUR_ONE',
  'THREE_THREE_FOUR',
  'FIVE_TWO_THREE',
  'FOUR_FOUR_TWO_DIAMOND',
  'FIVE_ONE_TWO_TWO',
]);

/**
 * Create tactic validation
 */
export const createTacticSchema = z.object({
  teamId: uuidSchema,
  name: z.string().min(2).max(100).trim(),
  formation: formationEnumSchema,
  playStyle: z.enum(['POSSESSION', 'COUNTER', 'BALANCED']).optional(),
  defensiveShape: z.enum(['COMPACT', 'BALANCED', 'AGGRESSIVE']).optional(),
  pressType: z.enum(['HIGH_PRESS', 'MID_BLOCK', 'LOW_BLOCK']).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  isDefault: z.boolean().optional().default(false),
});
export type CreateTacticInput = z.infer<typeof createTacticSchema>;

/**
 * Update tactic validation
 */
export const updateTacticSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  formation: formationEnumSchema.optional(),
  playStyle: z.enum(['POSSESSION', 'COUNTER', 'BALANCED']).optional(),
  defensiveShape: z.enum(['COMPACT', 'BALANCED', 'AGGRESSIVE']).optional(),
  pressType: z.enum(['HIGH_PRESS', 'MID_BLOCK', 'LOW_BLOCK']).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  isDefault: z.boolean().optional(),
});
export type UpdateTacticInput = z.infer<typeof updateTacticSchema>;

// ============================================================================
// PERFORMANCE METRIC SCHEMAS (PerformanceMetric model)
// ============================================================================

/**
 * Create performance metric validation
 */
export const createPerformanceMetricSchema = z.object({
  playerId: uuidSchema,
  metricType: z.string().max(100),
  value: z.number(),
  unit: z.string().max(50).optional(),
  recordedDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().max(500).optional(),
});
export type CreatePerformanceMetricInput = z.infer<
  typeof createPerformanceMetricSchema
>;

/**
 * Update performance metric validation
 */
export const updatePerformanceMetricSchema = z.object({
  value: z.number().optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});
export type UpdatePerformanceMetricInput = z.infer<
  typeof updatePerformanceMetricSchema
>;

// ============================================================================
// ACHIEVEMENT SCHEMAS (Achievement model)
// ============================================================================

/**
 * Create achievement validation
 */
export const createAchievementSchema = z.object({
  playerId: uuidSchema,
  title: z.string().min(2).max(255).trim(),
  description: z.string().max(2000).optional(),
  category: achievementCategoryEnumSchema,
  awardedDate: z.string().datetime('Invalid date format'),
  icon: urlSchema,
  points: z.number().min(0).max(1000).optional().default(0),
});
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;

/**
 * Update achievement validation
 */
export const updateAchievementSchema = z.object({
  title: z.string().min(2).max(255).trim().optional(),
  description: z.string().max(2000).optional(),
  category: achievementCategoryEnumSchema.optional(),
  icon: urlSchema,
  points: z.number().min(0).max(1000).optional(),
});
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;

// ============================================================================
// CONTRACT SCHEMAS (PlayerContract model)
// ============================================================================

/**
 * Create contract validation
 */
export const createContractSchema = z
  .object({
    playerId: uuidSchema,
    teamId: uuidSchema,
    startDate: z.string().datetime('Invalid date format'),
    endDate: z.string().datetime('Invalid date format'),
    salary: z.number().min(0).max(999999999).optional(),
    position: positionEnumSchema.optional(),
    contractType: z
      .enum(['PERMANENT', 'TEMPORARY', 'LOAN', 'YOUTH', 'AMATEUR'])
      .optional(),
    joinDate: z.string().datetime().optional(),
    releaseClause: z.number().min(0).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
export type CreateContractInput = z.infer<typeof createContractSchema>;

/**
 * Update contract validation
 */
export const updateContractSchema = z.object({
  endDate: z.string().datetime().optional(),
  salary: z.number().min(0).max(999999999).optional(),
  position: positionEnumSchema.optional(),
  releaseClause: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdateContractInput = z.infer<typeof updateContractSchema>;

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
      return {
        isValid: false,
        error: 'Player must be at least 13 years old',
      };
    }

    if (age > 100) {
      return {
        isValid: false,
        error: 'Age seems invalid',
      };
    }

    return { isValid: true, age };
  } catch {
    return {
      isValid: false,
      error: 'Invalid date format',
    };
  }
}

/**
 * Validate player position for a specific sport
 */
export function getValidPositionsForSport(sport: Sport): string[] {
  const positionMap: Record<Sport, string[]> = {
    FOOTBALL: [
      'GOALKEEPER',
      'DEFENDER',
      'MIDFIELDER',
      'FORWARD',
    ],
    NETBALL: [
      'GOAL_SHOOTER',
      'GOAL_ATTACK',
      'WING_ATTACK',
      'CENTER',
      'WING_DEFENSE',
      'GOAL_DEFENSE',
      'GOALKEEPER_NETBALL',
    ],
    RUGBY: [
      'HOOKER',
      'LOOSEHEAD_PROP',
      'TIGHTHEAD_PROP',
      'LOCK',
      'FLANKER',
      'NUMBER_8',
      'SCRUM_HALF',
      'FLY_HALF',
      'INSIDE_CENTER',
      'OUTSIDE_CENTER',
      'WING',
      'FULLBACK',
    ],
    CRICKET: [
      'BATSMAN',
      'BOWLER',
      'ALL_ROUNDER',
      'WICKET_KEEPER',
      'FIELDER_CRICKET',
    ],
    AMERICAN_FOOTBALL: [
      'QUARTERBACK',
      'RUNNING_BACK',
      'WIDE_RECEIVER',
      'TIGHT_END',
      'OFFENSIVE_LINEMAN',
      'DEFENSIVE_LINEMAN',
      'LINEBACKER',
      'CORNERBACK',
      'SAFETY',
      'KICKER',
    ],
    BASKETBALL: [
      'POINT_GUARD',
      'SHOOTING_GUARD',
      'SMALL_FORWARD',
      'POWER_FORWARD',
      'CENTER_BASKETBALL',
    ],
  };

  return positionMap[sport] || [];
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
 * Validate match result scores
 */
export function validateMatchResult(result: {
  homeGoals: number;
  awayGoals: number;
  homeGoalsET?: number;
  awayGoalsET?: number;
  homePenalties?: number;
  awayPenalties?: number;
}): { isValid: boolean; error?: string } {
  if (result.homeGoals < 0 || result.awayGoals < 0) {
    return { isValid: false, error: 'Goals cannot be negative' };
  }

  const homeET = (result.homeGoalsET || 0) + result.homeGoals;
  const awayET = (result.awayGoalsET || 0) + result.awayGoals;

  if (result.homePenalties || result.awayPenalties) {
    if (homeET !== awayET) {
      return {
        isValid: false,
        error: 'Penalties can only be used when match is tied after extra time',
      };
    }
  }

  return { isValid: true };
}

// ============================================================================
// EXPORT ALL SCHEMAS & TYPES
// ============================================================================

export default {
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
  calculateAge,
  validateMatchResult,
};