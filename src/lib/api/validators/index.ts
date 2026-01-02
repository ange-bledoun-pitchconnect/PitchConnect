/**
 * ============================================================================
 * ✅ PITCHCONNECT - Enterprise Validators v7.10.1
 * Path: src/lib/api/validators/index.ts
 * ============================================================================
 * 
 * Complete Zod validation schemas for all 12 sports
 * Aligned with Prisma schema enums
 * Type-safe input validation
 * 
 * ============================================================================
 */

import { z } from 'zod';

// =============================================================================
// SPORT ENUM & POSITIONS
// =============================================================================

/**
 * All 12 supported sports
 */
export const SportEnum = z.enum([
  'FOOTBALL',
  'RUGBY',
  'CRICKET',
  'BASKETBALL',
  'AMERICAN_FOOTBALL',
  'NETBALL',
  'HOCKEY',
  'LACROSSE',
  'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL',
  'FUTSAL',
  'BEACH_FOOTBALL',
]);

export type Sport = z.infer<typeof SportEnum>;

/**
 * Positions by sport - comprehensive list from schema
 */
export const POSITIONS_BY_SPORT: Record<Sport, string[]> = {
  FOOTBALL: [
    'GOALKEEPER', 'SWEEPER', 'CENTRE_BACK', 'LEFT_BACK', 'RIGHT_BACK',
    'LEFT_WING_BACK', 'RIGHT_WING_BACK', 'DEFENSIVE_MIDFIELDER',
    'CENTRAL_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
    'ATTACKING_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER',
    'SECOND_STRIKER', 'CENTRE_FORWARD', 'STRIKER',
  ],
  RUGBY: [
    'LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP', 'LOCK', 'SECOND_ROW',
    'BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_EIGHT',
    'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTRE', 'OUTSIDE_CENTRE',
    'LEFT_WING', 'RIGHT_WING', 'FULL_BACK',
  ],
  CRICKET: [
    'OPENING_BATTER', 'TOP_ORDER_BATTER', 'MIDDLE_ORDER_BATTER',
    'LOWER_ORDER_BATTER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATTER',
    'FAST_BOWLER', 'MEDIUM_FAST_BOWLER', 'MEDIUM_BOWLER',
    'SPIN_BOWLER', 'OFF_SPINNER', 'LEG_SPINNER',
    'ALL_ROUNDER', 'BATTING_ALL_ROUNDER', 'BOWLING_ALL_ROUNDER',
  ],
  BASKETBALL: [
    'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD',
    'POWER_FORWARD', 'CENTER',
  ],
  AMERICAN_FOOTBALL: [
    'QUARTERBACK', 'RUNNING_BACK', 'FULLBACK', 'WIDE_RECEIVER',
    'TIGHT_END', 'OFFENSIVE_TACKLE', 'OFFENSIVE_GUARD', 'CENTER',
    'DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'NOSE_TACKLE',
    'OUTSIDE_LINEBACKER', 'INSIDE_LINEBACKER', 'MIDDLE_LINEBACKER',
    'CORNERBACK', 'FREE_SAFETY', 'STRONG_SAFETY',
    'KICKER', 'PUNTER', 'LONG_SNAPPER', 'KICK_RETURNER', 'PUNT_RETURNER',
  ],
  NETBALL: [
    'GOAL_SHOOTER', 'GOAL_ATTACK', 'WING_ATTACK',
    'CENTRE', 'WING_DEFENCE', 'GOAL_DEFENCE', 'GOAL_KEEPER',
  ],
  HOCKEY: [
    'GOALKEEPER', 'SWEEPER', 'LEFT_BACK', 'RIGHT_BACK', 'CENTRE_BACK',
    'LEFT_HALF', 'RIGHT_HALF', 'CENTRE_HALF',
    'LEFT_WING', 'RIGHT_WING', 'INSIDE_LEFT', 'INSIDE_RIGHT',
    'CENTRE_FORWARD', 'STRIKER',
  ],
  LACROSSE: [
    'GOALKEEPER', 'CLOSE_DEFENDER', 'DEFENSIVE_MIDFIELDER',
    'LONG_STICK_MIDFIELDER', 'MIDFIELDER', 'FACE_OFF_SPECIALIST',
    'ATTACK_MIDFIELDER', 'ATTACKER', 'CREASE_ATTACKER',
  ],
  AUSTRALIAN_RULES: [
    'FULL_BACK', 'BACK_POCKET', 'CENTRE_HALF_BACK', 'HALF_BACK_FLANK',
    'WING', 'CENTRE', 'RUCK', 'RUCK_ROVER', 'ROVER',
    'CENTRE_HALF_FORWARD', 'HALF_FORWARD_FLANK', 'FORWARD_POCKET',
    'FULL_FORWARD',
  ],
  GAELIC_FOOTBALL: [
    'GOALKEEPER', 'CORNER_BACK', 'FULL_BACK', 'HALF_BACK',
    'CENTRE_BACK', 'WING_BACK', 'MIDFIELDER',
    'CENTRE_FORWARD', 'HALF_FORWARD', 'WING_FORWARD',
    'CORNER_FORWARD', 'FULL_FORWARD',
  ],
  FUTSAL: [
    'GOALKEEPER', 'FIXO', 'ALA_LEFT', 'ALA_RIGHT', 'PIVOT',
  ],
  BEACH_FOOTBALL: [
    'GOALKEEPER', 'DEFENDER', 'WINGER', 'PIVOT', 'STRIKER',
  ],
};

/**
 * Create position enum for specific sport
 */
export function getPositionEnumForSport(sport: Sport) {
  return z.enum(POSITIONS_BY_SPORT[sport] as [string, ...string[]]);
}

/**
 * Universal position enum (all positions)
 */
export const PositionEnum = z.enum([
  // Football
  'GOALKEEPER', 'SWEEPER', 'CENTRE_BACK', 'LEFT_BACK', 'RIGHT_BACK',
  'LEFT_WING_BACK', 'RIGHT_WING_BACK', 'DEFENSIVE_MIDFIELDER',
  'CENTRAL_MIDFIELDER', 'LEFT_MIDFIELDER', 'RIGHT_MIDFIELDER',
  'ATTACKING_MIDFIELDER', 'LEFT_WINGER', 'RIGHT_WINGER',
  'SECOND_STRIKER', 'CENTRE_FORWARD', 'STRIKER',
  // Rugby
  'LOOSEHEAD_PROP', 'HOOKER', 'TIGHTHEAD_PROP', 'LOCK', 'SECOND_ROW',
  'BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_EIGHT',
  'SCRUM_HALF', 'FLY_HALF', 'INSIDE_CENTRE', 'OUTSIDE_CENTRE',
  'LEFT_WING', 'RIGHT_WING', 'FULL_BACK',
  // Cricket
  'OPENING_BATTER', 'TOP_ORDER_BATTER', 'MIDDLE_ORDER_BATTER',
  'LOWER_ORDER_BATTER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATTER',
  'FAST_BOWLER', 'MEDIUM_FAST_BOWLER', 'MEDIUM_BOWLER',
  'SPIN_BOWLER', 'OFF_SPINNER', 'LEG_SPINNER',
  'ALL_ROUNDER', 'BATTING_ALL_ROUNDER', 'BOWLING_ALL_ROUNDER',
  // Basketball
  'POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD',
  'POWER_FORWARD', 'CENTER',
  // American Football
  'QUARTERBACK', 'RUNNING_BACK', 'FULLBACK', 'WIDE_RECEIVER',
  'TIGHT_END', 'OFFENSIVE_TACKLE', 'OFFENSIVE_GUARD',
  'DEFENSIVE_END', 'DEFENSIVE_TACKLE', 'NOSE_TACKLE',
  'OUTSIDE_LINEBACKER', 'INSIDE_LINEBACKER', 'MIDDLE_LINEBACKER',
  'CORNERBACK', 'FREE_SAFETY', 'STRONG_SAFETY',
  'KICKER', 'PUNTER', 'LONG_SNAPPER', 'KICK_RETURNER', 'PUNT_RETURNER',
  // Netball
  'GOAL_SHOOTER', 'GOAL_ATTACK', 'WING_ATTACK',
  'CENTRE', 'WING_DEFENCE', 'GOAL_DEFENCE', 'GOAL_KEEPER',
  // Hockey
  'LEFT_HALF', 'RIGHT_HALF', 'CENTRE_HALF',
  'INSIDE_LEFT', 'INSIDE_RIGHT',
  // Lacrosse
  'CLOSE_DEFENDER', 'LONG_STICK_MIDFIELDER', 'FACE_OFF_SPECIALIST',
  'ATTACK_MIDFIELDER', 'ATTACKER', 'CREASE_ATTACKER',
  // Australian Rules
  'BACK_POCKET', 'CENTRE_HALF_BACK', 'HALF_BACK_FLANK',
  'WING', 'RUCK', 'RUCK_ROVER', 'ROVER',
  'CENTRE_HALF_FORWARD', 'HALF_FORWARD_FLANK', 'FORWARD_POCKET',
  'FULL_FORWARD',
  // Gaelic Football
  'CORNER_BACK', 'HALF_BACK', 'WING_BACK',
  'HALF_FORWARD', 'WING_FORWARD', 'CORNER_FORWARD',
  // Futsal
  'FIXO', 'ALA_LEFT', 'ALA_RIGHT', 'PIVOT',
  // Beach Football
  'DEFENDER', 'WINGER',
  // General
  'MIDFIELDER',
]);

// =============================================================================
// USER ROLE & STATUS ENUMS
// =============================================================================

export const UserRoleEnum = z.enum([
  'SUPERADMIN',
  'ADMIN',
  'CLUB_OWNER',
  'CLUB_MANAGER',
  'MANAGER',
  'COACH',
  'COACH_PRO',
  'PLAYER',
  'PLAYER_PRO',
  'PARENT',
  'GUARDIAN',
  'FAN',
  'REFEREE',
  'SCOUT',
  'ANALYST',
  'MEDICAL_STAFF',
  'TREASURER',
  'LEAGUE_ADMIN',
]);

export const UserStatusEnum = z.enum([
  'ACTIVE',
  'PENDING_VERIFICATION',
  'SUSPENDED',
  'BANNED',
  'INACTIVE',
]);

export const AccountTierEnum = z.enum([
  'FREE',
  'PRO',
  'PREMIUM',
  'ENTERPRISE',
]);

// =============================================================================
// COMMON ENUMS
// =============================================================================

export const PreferredFootEnum = z.enum(['LEFT', 'RIGHT', 'BOTH']);

export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']);

export const MatchStatusEnum = z.enum([
  'SCHEDULED',
  'POSTPONED',
  'CANCELLED',
  'IN_PROGRESS',
  'HALF_TIME',
  'COMPLETED',
  'ABANDONED',
]);

export const PlayerStatusEnum = z.enum([
  'ACTIVE',
  'INJURED',
  'SUSPENDED',
  'ON_LOAN',
  'RETIRED',
  'INACTIVE',
  'TRANSFERRED',
]);

export const InjuryTypeEnum = z.enum([
  'MUSCLE',
  'LIGAMENT',
  'BONE',
  'JOINT',
  'CONCUSSION',
  'LACERATION',
  'CONTUSION',
  'STRAIN',
  'SPRAIN',
  'FRACTURE',
  'DISLOCATION',
  'TENDON',
  'OTHER',
]);

export const InjurySeverityEnum = z.enum([
  'MINOR',
  'MODERATE',
  'SEVERE',
  'CAREER_THREATENING',
]);

export const BodyPartEnum = z.enum([
  'HEAD',
  'NECK',
  'SHOULDER',
  'ARM',
  'ELBOW',
  'WRIST',
  'HAND',
  'FINGER',
  'CHEST',
  'BACK',
  'ABDOMEN',
  'HIP',
  'GROIN',
  'THIGH',
  'HAMSTRING',
  'KNEE',
  'CALF',
  'ANKLE',
  'FOOT',
  'TOE',
  'OTHER',
]);

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  roles: z.array(UserRoleEnum).optional().default(['PLAYER']),
  dateOfBirth: z.string().datetime().optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial().omit({ password: true });

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// =============================================================================
// PLAYER SCHEMAS
// =============================================================================

export const PlayerCreateSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  dateOfBirth: z.string().datetime(),
  nationality: z.string().min(2).max(100),
  sport: SportEnum,
  position: PositionEnum,
  secondaryPosition: PositionEnum.optional(),
  preferredFoot: PreferredFootEnum.optional(),
  height: z.number().positive().max(300).optional(),
  weight: z.number().positive().max(300).optional(),
  shirtNumber: z.number().int().min(1).max(99).optional(),
  bio: z.string().max(1000).optional(),
});

export const PlayerUpdateSchema = PlayerCreateSchema.partial();

/**
 * Validate player position matches sport
 */
export const PlayerCreateWithValidationSchema = PlayerCreateSchema.refine(
  (data) => {
    const validPositions = POSITIONS_BY_SPORT[data.sport];
    return validPositions.includes(data.position);
  },
  {
    message: 'Position is not valid for the selected sport',
    path: ['position'],
  }
);

// =============================================================================
// TEAM SCHEMAS
// =============================================================================

export const TeamCreateSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100).trim(),
  code: z.string().min(1).max(10).toUpperCase(),
  clubId: z.string().cuid('Invalid club ID'),
  sport: SportEnum,
  ageGroup: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  gender: GenderEnum.optional(),
  maxPlayersOnCourt: z.number().int().positive().max(30).optional(),
  totalSquadSize: z.number().int().positive().max(100).optional(),
  description: z.string().max(500).optional(),
});

export const TeamUpdateSchema = TeamCreateSchema.partial().omit({ clubId: true });

// =============================================================================
// CLUB SCHEMAS
// =============================================================================

export const ClubCreateSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  shortName: z.string().min(1).max(10).toUpperCase().optional(),
  sport: SportEnum,
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postcode: z.string().max(20).optional(),
  description: z.string().max(1000).optional(),
});

export const ClubUpdateSchema = ClubCreateSchema.partial();

// =============================================================================
// MATCH SCHEMAS
// =============================================================================

export const MatchCreateSchema = z.object({
  homeTeamId: z.string().cuid('Invalid home team ID'),
  awayTeamId: z.string().cuid('Invalid away team ID'),
  fixtureId: z.string().cuid().optional(),
  refereeId: z.string().cuid().optional(),
  sport: SportEnum,
  date: z.string().datetime(),
  kickOffTime: z.string().datetime().optional(),
  venue: z.string().max(200).optional(),
  venueCity: z.string().max(100).optional(),
  competitionId: z.string().cuid().optional(),
  round: z.string().max(50).optional(),
  matchweek: z.number().int().positive().optional(),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
  message: 'Home team and away team must be different',
  path: ['awayTeamId'],
});

export const MatchUpdateSchema = MatchCreateSchema.partial();

export const MatchEventSchema = z.object({
  matchId: z.string().cuid('Invalid match ID'),
  type: z.enum([
    'GOAL', 'OWN_GOAL', 'PENALTY_GOAL', 'PENALTY_MISSED',
    'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW',
    'SUBSTITUTION', 'INJURY', 'VAR_DECISION',
    'KICK_OFF', 'HALF_TIME', 'FULL_TIME', 'EXTRA_TIME',
    // Rugby specific
    'TRY', 'CONVERSION', 'PENALTY_KICK', 'DROP_GOAL',
    // Cricket specific
    'WICKET', 'RUNS', 'BOUNDARY', 'SIX', 'EXTRAS',
    // Basketball specific
    'BASKET', 'THREE_POINTER', 'FREE_THROW', 'FOUL',
    // Generic
    'OTHER',
  ]),
  playerId: z.string().cuid().optional(),
  assistedBy: z.string().cuid().optional(),
  minute: z.number().int().min(0).max(150),
  isExtraTime: z.boolean().optional().default(false),
  additionalInfo: z.string().max(500).optional(),
});

// =============================================================================
// INJURY SCHEMAS
// =============================================================================

export const InjuryCreateSchema = z.object({
  playerId: z.string().cuid('Invalid player ID'),
  type: InjuryTypeEnum,
  severity: InjurySeverityEnum,
  bodyPart: BodyPartEnum,
  description: z.string().max(500).optional(),
  injuryDate: z.string().datetime(),
  expectedReturnDate: z.string().datetime().optional(),
  medicalNotes: z.string().max(2000).optional(),
  treatedBy: z.string().max(100).optional(),
});

export const InjuryUpdateSchema = InjuryCreateSchema.partial().omit({ playerId: true });

// =============================================================================
// PAGINATION & QUERY SCHEMAS
// =============================================================================

export const PaginationQuerySchema = z.object({
  page: z.string().pipe(z.coerce.number().int().positive()).optional().default('1'),
  limit: z.string().pipe(z.coerce.number().int().min(1).max(100)).optional().default('20'),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const SearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().max(100).optional(),
  status: z.string().optional(),
  sport: SportEnum.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate request body against schema
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const fieldErrors = Object.fromEntries(
        error.errors.map(e => [e.path.join('.'), e.message])
      );
      throw {
        name: 'ValidationError',
        message: 'Validation failed',
        fieldErrors,
        errors: error.errors,
      };
    }
    throw { name: 'ValidationError', message: 'Invalid JSON body' };
  }
}

/**
 * Validate query parameters against schema
 */
export function validateQuery<T>(
  url: URL,
  schema: z.ZodSchema<T>
): T {
  try {
    const query = Object.fromEntries(url.searchParams);
    return schema.parse(query);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const fieldErrors = Object.fromEntries(
        error.errors.map(e => [e.path.join('.'), e.message])
      );
      throw {
        name: 'ValidationError',
        message: 'Invalid query parameters',
        fieldErrors,
        errors: error.errors,
      };
    }
    throw { name: 'ValidationError', message: 'Invalid query parameters' };
  }
}

/**
 * Validate path parameters
 */
export function validateParams<T>(
  params: Record<string, string>,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const fieldErrors = Object.fromEntries(
        error.errors.map(e => [e.path.join('.'), e.message])
      );
      throw {
        name: 'ValidationError',
        message: 'Invalid path parameters',
        fieldErrors,
      };
    }
    throw { name: 'ValidationError', message: 'Invalid path parameters' };
  }
}

/**
 * Validate position for sport
 */
export function validatePositionForSport(position: string, sport: Sport): boolean {
  return POSITIONS_BY_SPORT[sport].includes(position);
}

/**
 * Get valid positions for sport
 */
export function getValidPositions(sport: Sport): string[] {
  return POSITIONS_BY_SPORT[sport];
}

// =============================================================================
// ID VALIDATION SCHEMAS
// =============================================================================

export const IdParamSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

export const ClubIdParamSchema = z.object({
  clubId: z.string().cuid('Invalid club ID'),
});

export const TeamIdParamSchema = z.object({
  teamId: z.string().cuid('Invalid team ID'),
});

export const PlayerIdParamSchema = z.object({
  playerId: z.string().cuid('Invalid player ID'),
});

export const MatchIdParamSchema = z.object({
  matchId: z.string().cuid('Invalid match ID'),
});

// =============================================================================
// EXPORTS
// =============================================================================

export type { Sport };
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type PlayerCreate = z.infer<typeof PlayerCreateSchema>;
export type PlayerUpdate = z.infer<typeof PlayerUpdateSchema>;
export type TeamCreate = z.infer<typeof TeamCreateSchema>;
export type TeamUpdate = z.infer<typeof TeamUpdateSchema>;
export type ClubCreate = z.infer<typeof ClubCreateSchema>;
export type ClubUpdate = z.infer<typeof ClubUpdateSchema>;
export type MatchCreate = z.infer<typeof MatchCreateSchema>;
export type MatchUpdate = z.infer<typeof MatchUpdateSchema>;
export type MatchEvent = z.infer<typeof MatchEventSchema>;
export type InjuryCreate = z.infer<typeof InjuryCreateSchema>;
export type InjuryUpdate = z.infer<typeof InjuryUpdateSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
