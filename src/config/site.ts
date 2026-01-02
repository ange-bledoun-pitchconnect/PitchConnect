/**
 * ============================================================================
 * SITE CONFIGURATION - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade site configuration with:
 * - Full multi-sport support (12 sports)
 * - Zod validation with runtime safety
 * - Environment-aware configuration
 * - Feature flags system
 * - Pricing tiers with Stripe integration
 * - Regional/localization settings
 * - Sport-specific match configurations
 * 
 * @version 3.0.0
 * @path src/config/site.ts
 * 
 * ============================================================================
 */

import { z } from 'zod';

// =============================================================================
// SPORT ENUM (Must match Prisma Schema)
// =============================================================================

export const SportEnum = z.enum([
  'FOOTBALL',
  'NETBALL',
  'RUGBY',
  'CRICKET',
  'AMERICAN_FOOTBALL',
  'BASKETBALL',
  'HOCKEY',
  'LACROSSE',
  'AUSTRALIAN_RULES',
  'GAELIC_FOOTBALL',
  'FUTSAL',
  'BEACH_FOOTBALL',
]);

export type Sport = z.infer<typeof SportEnum>;

// =============================================================================
// SPORT CONFIGURATION SCHEMA
// =============================================================================

const SportConfigSchema = z.object({
  /** Sport identifier */
  sport: SportEnum,
  /** Display name */
  name: z.string(),
  /** Short name for compact displays */
  shortName: z.string(),
  /** Sport icon (emoji or icon name) */
  icon: z.string(),
  /** Primary brand color */
  primaryColor: z.string(),
  /** Secondary brand color */
  secondaryColor: z.string(),
  
  // Match Configuration
  /** Standard match duration in minutes */
  matchDuration: z.number().min(1),
  /** Break/halftime duration in minutes */
  breakDuration: z.number().min(0),
  /** Extra time duration if applicable */
  extraTimeDuration: z.number().min(0).optional(),
  /** Number of periods (halves, quarters, etc.) */
  periodCount: z.number().min(1),
  /** Name of period (Half, Quarter, Period, Innings, etc.) */
  periodName: z.string(),
  /** Whether overtime/extra time is possible */
  hasOvertime: z.boolean(),
  /** Whether draws/ties are possible */
  hasDraws: z.boolean(),
  
  // Scoring Configuration
  /** Points for a win */
  pointsWin: z.number().min(0),
  /** Points for a draw */
  pointsDraw: z.number().min(0),
  /** Points for a loss */
  pointsLoss: z.number().min(0),
  /** Primary scoring term (Goal, Try, Run, Point, etc.) */
  scoringTermPrimary: z.string(),
  /** Secondary scoring term if applicable */
  scoringTermSecondary: z.string().optional(),
  /** Scoring unit for totals */
  scoringUnit: z.string(),
  
  // Squad Configuration
  /** Players on field/court at once */
  playersOnField: z.number().min(1),
  /** Maximum squad/roster size */
  maxSquadSize: z.number().min(1),
  /** Maximum substitutions allowed (-1 for unlimited) */
  maxSubstitutions: z.number().min(-1),
  /** Whether rolling/flying substitutions allowed */
  rollingSubstitutions: z.boolean(),
  
  // Season Configuration
  /** Typical season start month (1-12) */
  seasonStartMonth: z.number().min(1).max(12),
  /** Typical season end month (1-12) */
  seasonEndMonth: z.number().min(1).max(12),
  
  // Sport Features
  /** Has formations/tactical setups */
  hasFormations: z.boolean(),
  /** Has numbered positions (like Rugby 1-15) */
  hasNumberedPositions: z.boolean(),
  /** Has set pieces */
  hasSetPieces: z.boolean(),
  /** Has penalty shootouts */
  hasPenaltyShootout: z.boolean(),
  /** Governing body name */
  governingBody: z.string(),
});

export type SportConfig = z.infer<typeof SportConfigSchema>;

// =============================================================================
// PRICING TIER SCHEMA
// =============================================================================

const PricingTierSchema = z.object({
  name: z.string(),
  price: z.number().min(0),
  period: z.enum(['monthly', 'yearly']).optional(),
  description: z.string(),
  features: z.array(z.string()),
  stripePriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
  highlighted: z.boolean().default(false),
  maxTeams: z.number().min(-1).default(-1), // -1 = unlimited
  maxPlayers: z.number().min(-1).default(-1),
  maxStorage: z.string().default('0GB'),
  apiAccess: z.boolean().default(false),
});

export type PricingTier = z.infer<typeof PricingTierSchema>;

// =============================================================================
// NAVIGATION LINK SCHEMA
// =============================================================================

const NavigationLinkSchema = z.object({
  title: z.string(),
  href: z.string(),
  external: z.boolean().default(false),
  icon: z.string().optional(),
  badge: z.string().optional(),
});

export type NavigationLink = z.infer<typeof NavigationLinkSchema>;

// =============================================================================
// FEATURE FLAGS SCHEMA
// =============================================================================

const FeatureFlagsSchema = z.object({
  liveScoring: z.boolean(),
  payments: z.boolean(),
  notifications: z.boolean(),
  analytics: z.boolean(),
  videoAnalysis: z.boolean(),
  tacticalBoard: z.boolean(),
  scouting: z.boolean(),
  trainingPlanner: z.boolean(),
  gamification: z.boolean(),
  websocketUpdates: z.boolean(),
  realTimeSync: z.boolean(),
  teamChat: z.boolean(),
  mobileApp: z.boolean(),
  pwa: z.boolean(),
  aiInsights: z.boolean(),
  injuryPrediction: z.boolean(),
  formationOptimizer: z.boolean(),
  multiSport: z.boolean(),
});

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

// =============================================================================
// REGIONAL SETTINGS SCHEMA
// =============================================================================

const RegionalSettingsSchema = z.object({
  locale: z.string(),
  timezone: z.string(),
  currency: z.string(),
  currencySymbol: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  country: z.string(),
  distanceUnit: z.enum(['km', 'miles']),
  temperatureUnit: z.enum(['celsius', 'fahrenheit']),
});

export type RegionalSettings = z.infer<typeof RegionalSettingsSchema>;

// =============================================================================
// FULL SITE CONFIG SCHEMA
// =============================================================================

const SiteConfigSchema = z.object({
  // Basic Info
  name: z.string(),
  description: z.string(),
  tagline: z.string(),
  url: z.string().url(),
  ogImage: z.string(),
  twitter: z.string(),
  
  // App Version & Build
  version: z.string(),
  buildId: z.string(),
  buildTimestamp: z.string(),
  environment: z.enum(['development', 'staging', 'production']),
  
  // API Configuration
  api: z.object({
    url: z.string().url(),
    timeout: z.number().min(1000),
    version: z.string(),
    retryAttempts: z.number().min(0),
    retryDelay: z.number().min(0),
  }),
  
  // Multi-Sport Configuration
  sports: z.record(SportEnum, SportConfigSchema),
  defaultSport: SportEnum,
  
  // Regional Settings
  regional: RegionalSettingsSchema,
  
  // Feature Flags
  features: FeatureFlagsSchema,
  
  // Pricing Tiers
  pricing: z.object({
    free: PricingTierSchema,
    standard: PricingTierSchema,
    professional: PricingTierSchema,
    elite: PricingTierSchema,
  }),
  
  // Navigation
  navLinks: z.array(NavigationLinkSchema),
  footerLinks: z.object({
    product: z.array(NavigationLinkSchema),
    company: z.array(NavigationLinkSchema),
    legal: z.array(NavigationLinkSchema),
    social: z.array(NavigationLinkSchema),
  }),
  
  // Support & Contact
  support: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    url: z.string().url(),
    documentation: z.string().url(),
    status: z.string().url(),
  }),
  
  // Limits & Quotas
  limits: z.object({
    maxFileUploadSize: z.number(), // in bytes
    maxVideoLength: z.number(), // in seconds
    maxTeamMembers: z.number(),
    maxMatchesPerDay: z.number(),
    rateLimit: z.number(), // requests per minute
  }),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

// =============================================================================
// SPORT CONFIGURATIONS - ALL 12 SPORTS
// =============================================================================

const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  // =========================================================================
  // FOOTBALL (Soccer)
  // =========================================================================
  FOOTBALL: {
    sport: 'FOOTBALL',
    name: 'Football',
    shortName: 'Football',
    icon: '⚽',
    primaryColor: '#22C55E',
    secondaryColor: '#FFFFFF',
    matchDuration: 90,
    breakDuration: 15,
    extraTimeDuration: 30,
    periodCount: 2,
    periodName: 'Half',
    hasOvertime: true,
    hasDraws: true,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    scoringTermPrimary: 'Goal',
    scoringUnit: 'goals',
    playersOnField: 11,
    maxSquadSize: 25,
    maxSubstitutions: 5,
    rollingSubstitutions: false,
    seasonStartMonth: 8,
    seasonEndMonth: 5,
    hasFormations: true,
    hasNumberedPositions: false,
    hasSetPieces: true,
    hasPenaltyShootout: true,
    governingBody: 'FIFA / FA',
  },

  // =========================================================================
  // RUGBY (Union)
  // =========================================================================
  RUGBY: {
    sport: 'RUGBY',
    name: 'Rugby Union',
    shortName: 'Rugby',
    icon: '🏉',
    primaryColor: '#8B5CF6',
    secondaryColor: '#FFFFFF',
    matchDuration: 80,
    breakDuration: 10,
    extraTimeDuration: 20,
    periodCount: 2,
    periodName: 'Half',
    hasOvertime: true,
    hasDraws: true,
    pointsWin: 4,
    pointsDraw: 2,
    pointsLoss: 0,
    scoringTermPrimary: 'Try',
    scoringTermSecondary: 'Conversion',
    scoringUnit: 'points',
    playersOnField: 15,
    maxSquadSize: 23,
    maxSubstitutions: 8,
    rollingSubstitutions: false,
    seasonStartMonth: 9,
    seasonEndMonth: 5,
    hasFormations: false,
    hasNumberedPositions: true,
    hasSetPieces: true,
    hasPenaltyShootout: false,
    governingBody: 'World Rugby / RFU',
  },

  // =========================================================================
  // CRICKET
  // =========================================================================
  CRICKET: {
    sport: 'CRICKET',
    name: 'Cricket',
    shortName: 'Cricket',
    icon: '🏏',
    primaryColor: '#F59E0B',
    secondaryColor: '#FFFFFF',
    matchDuration: 420, // T20 = 180, ODI = 420, Test = variable
    breakDuration: 20,
    periodCount: 2,
    periodName: 'Innings',
    hasOvertime: false,
    hasDraws: true,
    pointsWin: 2,
    pointsDraw: 1,
    pointsLoss: 0,
    scoringTermPrimary: 'Run',
    scoringTermSecondary: 'Wicket',
    scoringUnit: 'runs',
    playersOnField: 11,
    maxSquadSize: 15,
    maxSubstitutions: 1, // Impact sub in some formats
    rollingSubstitutions: false,
    seasonStartMonth: 4,
    seasonEndMonth: 9,
    hasFormations: false,
    hasNumberedPositions: false,
    hasSetPieces: false,
    hasPenaltyShootout: false,
    governingBody: 'ICC / ECB',
  },

  // =========================================================================
  // BASKETBALL
  // =========================================================================
  BASKETBALL: {
    sport: 'BASKETBALL',
    name: 'Basketball',
    shortName: 'Basketball',
    icon: '🏀',
    primaryColor: '#EF4444',
    secondaryColor: '#FFFFFF',
    matchDuration: 48, // NBA: 48, FIBA: 40
    breakDuration: 15,
    extraTimeDuration: 5,
    periodCount: 4,
    periodName: 'Quarter',
    hasOvertime: true,
    hasDraws: false,
    pointsWin: 2,
    pointsDraw: 0,
    pointsLoss: 0,
    scoringTermPrimary: 'Point',
    scoringTermSecondary: 'Three-Pointer',
    scoringUnit: 'points',
    playersOnField: 5,
    maxSquadSize: 15,
    maxSubstitutions: -1, // Unlimited
    rollingSubstitutions: true,
    seasonStartMonth: 10,
    seasonEndMonth: 6,
    hasFormations: false,
    hasNumberedPositions: false,
    hasSetPieces: false,
    hasPenaltyShootout: false,
    governingBody: 'FIBA / NBA',
  },

  // =========================================================================
  // NETBALL
  // =========================================================================
  NETBALL: {
    sport: 'NETBALL',
    name: 'Netball',
    shortName: 'Netball',
    icon: '🏐',
    primaryColor: '#EC4899',
    secondaryColor: '#FFFFFF',
    matchDuration: 60,
    breakDuration: 5,
    extraTimeDuration: 14,
    periodCount: 4,
    periodName: 'Quarter',
    hasOvertime: true,
    hasDraws: true,
    pointsWin: 2,
    pointsDraw: 1,
    pointsLoss: 0,
    scoringTermPrimary: 'Goal',
    scoringUnit: 'goals',
    playersOnField: 7,
    maxSquadSize: 12,
    maxSubstitutions: -1, // Unlimited between quarters
    rollingSubstitutions: false,
    seasonStartMonth: 2,
    seasonEndMonth: 9,
    hasFormations: false,
    hasNumberedPositions: false,
    hasSetPieces: false,
    hasPenaltyShootout: false,
    governingBody: 'INF / England Netball',
  },

  // =========================================================================
  // AMERICAN FOOTBALL
  // =========================================================================
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    name: 'American Football',
    shortName: 'Am. Football',
    icon: '🏈',
    primaryColor: '#6366F1',
    secondaryColor: '#FFFFFF',
    matchDuration: 60,
    breakDuration: 20, // Halftime
    extraTimeDuration: 10,
    periodCount: 4,
    periodName: 'Quarter',
    hasOvertime: true,
    hasDraws: false, // NFL can tie, but rare
    pointsWin: 2,
    pointsDraw: 1,
    pointsLoss: 0,
    scoringTermPrimary: 'Touchdown',
    scoringTermSecondary: 'Field Goal',
    scoringUnit: 'points',
    playersOnField: 11,
    maxSquadSize: 53,
    maxSubstitutions: -1, // Unlimited
    rollingSubstitutions: true,
    seasonStartMonth: 9,
    seasonEndMonth: 2,
    hasFormations: true,
    hasNumberedPositions: false,
    hasSetPieces: true,
    hasPenaltyShootout: false,
    governingBody: 'NFL / IFAF',
  },

  // =========================================================================
  // HOCKEY (Field Hockey)
  // =========================================================================
  HOCKEY: {
    sport: 'HOCKEY',
    name: 'Field Hockey',
    shortName: 'Hockey',
    icon: '🏑',
    primaryColor: '#06B6D4',
    secondaryColor: '#FFFFFF',
    matchDuration: 60,
    breakDuration: 10,
    extraTimeDuration: 15,
    periodCount: 4,
    periodName: 'Quarter',
    hasOvertime: true,
    hasDraws: true,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    scoringTermPrimary: 'Goal',
    scoringUnit: 'goals',
    playersOnField: 11,
    maxSquadSize: 18,
    maxSubstitutions: -1, // Unlimited rolling
    rollingSubstitutions: true,
    seasonStartMonth: 9,
    seasonEndMonth: 5,
    hasFormations: true,
    hasNumberedPositions: false,
    hasSetPieces: true,
    hasPenaltyShootout: true,
    governingBody: 'FIH / England Hockey',
  },

  // =========================================================================
  // LACROSSE
  // =========================================================================
  LACROSSE: {
    sport: 'LACROSSE',
    name: 'Lacrosse',
    shortName: 'Lacrosse',
    icon: '🥍',
    primaryColor: '#14B8A6',
    secondaryColor: '#FFFFFF',
    matchDuration: 60,
    breakDuration: 10,
    extraTimeDuration: 4, // Sudden death OT periods
    periodCount: 4,
    periodName: 'Quarter',
    hasOvertime: true,
    hasDraws: false,
    pointsWin: 2,
    pointsDraw: 0,
    pointsLoss: 0,
    scoringTermPrimary: 'Goal',
    scoringUnit: 'goals',
    playersOnField: 10,
    maxSquadSize: 23,
    maxSubstitutions: -1, // Unlimited
    rollingSubstitutions: true,
    seasonStartMonth: 2,
    seasonEndMonth: 8,
    hasFormations: false,
    hasNumberedPositions: false,
    hasSetPieces: true,
    hasPenaltyShootout: false,
    governingBody: 'World Lacrosse',
  },

  // =========================================================================
  // AUSTRALIAN RULES FOOTBALL
  // =========================================================================
  AUSTRALIAN_RULES: {
    sport: 'AUSTRALIAN_RULES',
    name: 'Australian Rules Football',
    shortName: 'AFL',
    icon: '🏉',
    primaryColor: '#F97316',
    secondaryColor: '#FFFFFF',
    matchDuration: 80,
    breakDuration: 20, // Halftime, plus 6 min quarter breaks
    periodCount: 4,
    periodName: 'Quarter',
    hasOvertime: true,
    hasDraws: true, // Regular season can draw
    pointsWin: 4,
    pointsDraw: 2,
    pointsLoss: 0,
    scoringTermPrimary: 'Goal',
    scoringTermSecondary: 'Behind',
    scoringUnit: 'points',
    playersOnField: 18,
    maxSquadSize: 22,
    maxSubstitutions: 90, // Interchange rotations
    rollingSubstitutions: true,
    seasonStartMonth: 3,
    seasonEndMonth: 9,
    hasFormations: false,
    hasNumberedPositions: false,
    hasSetPieces: true,
    hasPenaltyShootout: false,
    governingBody: 'AFL',
  },

  // =========================================================================
  // GAELIC FOOTBALL
  // =========================================================================
  GAELIC_FOOTBALL: {
    sport: 'GAELIC_FOOTBALL',
    name: 'Gaelic Football',
    shortName: 'GAA Football',
    icon: '🏐',
    primaryColor: '#84CC16',
    secondaryColor: '#FFFFFF',
    matchDuration: 70,
    breakDuration: 15,
    extraTimeDuration: 20,
    periodCount: 2,
    periodName: 'Half',
    hasOvertime: true,
    hasDraws: true,
    pointsWin: 2,
    pointsDraw: 1,
    pointsLoss: 0,
    scoringTermPrimary: 'Goal',
    scoringTermSecondary: 'Point',
    scoringUnit: 'points',
    playersOnField: 15,
    maxSquadSize: 24,
    maxSubstitutions: 5,
    rollingSubstitutions: false,
    seasonStartMonth: 1,
    seasonEndMonth: 9,
    hasFormations: false,
    hasNumberedPositions: false,
    hasSetPieces: true,
    hasPenaltyShootout: false,
    governingBody: 'GAA',
  },

  // =========================================================================
  // FUTSAL
  // =========================================================================
  FUTSAL: {
    sport: 'FUTSAL',
    name: 'Futsal',
    shortName: 'Futsal',
    icon: '⚽',
    primaryColor: '#10B981',
    secondaryColor: '#FFFFFF',
    matchDuration: 40,
    breakDuration: 15,
    extraTimeDuration: 10,
    periodCount: 2,
    periodName: 'Half',
    hasOvertime: true,
    hasDraws: true,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    scoringTermPrimary: 'Goal',
    scoringUnit: 'goals',
    playersOnField: 5,
    maxSquadSize: 14,
    maxSubstitutions: -1, // Unlimited
    rollingSubstitutions: true,
    seasonStartMonth: 9,
    seasonEndMonth: 5,
    hasFormations: true,
    hasNumberedPositions: false,
    hasSetPieces: true,
    hasPenaltyShootout: true,
    governingBody: 'FIFA / FA',
  },

  // =========================================================================
  // BEACH FOOTBALL (Beach Soccer)
  // =========================================================================
  BEACH_FOOTBALL: {
    sport: 'BEACH_FOOTBALL',
    name: 'Beach Soccer',
    shortName: 'Beach Soccer',
    icon: '🏖️',
    primaryColor: '#FBBF24',
    secondaryColor: '#06B6D4',
    matchDuration: 36,
    breakDuration: 3,
    extraTimeDuration: 3,
    periodCount: 3,
    periodName: 'Period',
    hasOvertime: true,
    hasDraws: false, // Always has winner
    pointsWin: 3,
    pointsDraw: 0,
    pointsLoss: 0,
    scoringTermPrimary: 'Goal',
    scoringUnit: 'goals',
    playersOnField: 5,
    maxSquadSize: 12,
    maxSubstitutions: -1, // Unlimited
    rollingSubstitutions: true,
    seasonStartMonth: 5,
    seasonEndMonth: 9,
    hasFormations: true,
    hasNumberedPositions: false,
    hasSetPieces: true,
    hasPenaltyShootout: true,
    governingBody: 'FIFA / Beach Soccer Worldwide',
  },
};

// =============================================================================
// ENVIRONMENT VARIABLE SCHEMA
// =============================================================================

const EnvVariablesSchema = z.object({
  // App Info
  NEXT_PUBLIC_APP_NAME: z.string().default('PitchConnect'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('7.10.1'),
  NEXT_PUBLIC_APP_TAGLINE: z.string().default('Multi-Sport Team Management Platform'),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default('The world\'s most comprehensive multi-sport team management platform for players, coaches, and clubs.'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // API
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),
  NEXT_PUBLIC_API_TIMEOUT: z.string().default('30000'),
  API_VERSION: z.string().default('3.0.0'),
  
  // Build
  NEXT_PUBLIC_APP_BUILD_ID: z.string().optional(),
  NEXT_PUBLIC_BUILD_TIMESTAMP: z.string().optional(),
  
  // Default Sport
  NEXT_PUBLIC_DEFAULT_SPORT: SportEnum.default('FOOTBALL'),
  
  // Regional Settings
  NEXT_PUBLIC_LOCALE: z.string().default('en-GB'),
  NEXT_PUBLIC_TIMEZONE: z.string().default('Europe/London'),
  NEXT_PUBLIC_COUNTRY: z.string().default('GB'),
  NEXT_PUBLIC_CURRENCY: z.string().default('GBP'),
  NEXT_PUBLIC_CURRENCY_SYMBOL: z.string().default('£'),
  NEXT_PUBLIC_DATE_FORMAT: z.string().default('DD/MM/YYYY'),
  NEXT_PUBLIC_TIME_FORMAT: z.string().default('HH:mm'),
  NEXT_PUBLIC_DISTANCE_UNIT: z.enum(['km', 'miles']).default('km'),
  NEXT_PUBLIC_TEMPERATURE_UNIT: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  
  // Feature Flags
  NEXT_PUBLIC_FEATURE_LIVE_SCORING: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_PAYMENTS: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_NOTIFICATIONS: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_ANALYTICS: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_VIDEO_ANALYSIS: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_TACTICAL_BOARD: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_SCOUTING: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_TRAINING_PLANNER: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_GAMIFICATION: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_WEBSOCKET_UPDATES: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_REAL_TIME_SYNC: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_TEAM_CHAT: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_MOBILE_APP: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_PWA: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_AI_INSIGHTS: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_INJURY_PREDICTION: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_FORMATION_OPTIMIZER: z.string().default('true'),
  NEXT_PUBLIC_FEATURE_MULTI_SPORT: z.string().default('true'),
  
  // Support
  SUPPORT_EMAIL: z.string().email().default('support@pitchconnect.com'),
  
  // Stripe
  STRIPE_PRICE_ID_STANDARD: z.string().optional(),
  STRIPE_PRICE_ID_PROFESSIONAL: z.string().optional(),
  STRIPE_PRICE_ID_ELITE: z.string().optional(),
  STRIPE_PRODUCT_ID_STANDARD: z.string().optional(),
  STRIPE_PRODUCT_ID_PROFESSIONAL: z.string().optional(),
  STRIPE_PRODUCT_ID_ELITE: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse boolean from environment variable string
 */
function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer from environment variable string
 */
function parseInteger(value: string | undefined, defaultValue = 0): number {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// =============================================================================
// SITE CONFIG FACTORY
// =============================================================================

/**
 * Create validated site configuration from environment variables
 * @throws {ZodError} If validation fails
 */
export function createSiteConfig(): SiteConfig {
  // Validate environment variables
  const env = EnvVariablesSchema.parse(process.env);
  
  return {
    // Basic Info
    name: env.NEXT_PUBLIC_APP_NAME,
    description: env.NEXT_PUBLIC_APP_DESCRIPTION,
    tagline: env.NEXT_PUBLIC_APP_TAGLINE,
    url: env.NEXT_PUBLIC_APP_URL,
    ogImage: `${env.NEXT_PUBLIC_APP_URL}/og-image.png`,
    twitter: '@pitchconnect',
    
    // App Version & Build
    version: env.NEXT_PUBLIC_APP_VERSION,
    buildId: env.NEXT_PUBLIC_APP_BUILD_ID || `build-${Date.now()}`,
    buildTimestamp: env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString(),
    environment: env.NEXT_PUBLIC_APP_ENV,
    
    // API Configuration
    api: {
      url: env.NEXT_PUBLIC_API_URL,
      timeout: parseInteger(env.NEXT_PUBLIC_API_TIMEOUT, 30000),
      version: env.API_VERSION,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    
    // Multi-Sport Configuration
    sports: SPORT_CONFIGS,
    defaultSport: env.NEXT_PUBLIC_DEFAULT_SPORT,
    
    // Regional Settings
    regional: {
      locale: env.NEXT_PUBLIC_LOCALE,
      timezone: env.NEXT_PUBLIC_TIMEZONE,
      currency: env.NEXT_PUBLIC_CURRENCY,
      currencySymbol: env.NEXT_PUBLIC_CURRENCY_SYMBOL,
      dateFormat: env.NEXT_PUBLIC_DATE_FORMAT,
      timeFormat: env.NEXT_PUBLIC_TIME_FORMAT,
      country: env.NEXT_PUBLIC_COUNTRY,
      distanceUnit: env.NEXT_PUBLIC_DISTANCE_UNIT,
      temperatureUnit: env.NEXT_PUBLIC_TEMPERATURE_UNIT,
    },
    
    // Feature Flags
    features: {
      liveScoring: parseBoolean(env.NEXT_PUBLIC_FEATURE_LIVE_SCORING, true),
      payments: parseBoolean(env.NEXT_PUBLIC_FEATURE_PAYMENTS, true),
      notifications: parseBoolean(env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS, true),
      analytics: parseBoolean(env.NEXT_PUBLIC_FEATURE_ANALYTICS, true),
      videoAnalysis: parseBoolean(env.NEXT_PUBLIC_FEATURE_VIDEO_ANALYSIS, true),
      tacticalBoard: parseBoolean(env.NEXT_PUBLIC_FEATURE_TACTICAL_BOARD, true),
      scouting: parseBoolean(env.NEXT_PUBLIC_FEATURE_SCOUTING, true),
      trainingPlanner: parseBoolean(env.NEXT_PUBLIC_FEATURE_TRAINING_PLANNER, true),
      gamification: parseBoolean(env.NEXT_PUBLIC_FEATURE_GAMIFICATION, true),
      websocketUpdates: parseBoolean(env.NEXT_PUBLIC_FEATURE_WEBSOCKET_UPDATES, true),
      realTimeSync: parseBoolean(env.NEXT_PUBLIC_FEATURE_REAL_TIME_SYNC, true),
      teamChat: parseBoolean(env.NEXT_PUBLIC_FEATURE_TEAM_CHAT, true),
      mobileApp: parseBoolean(env.NEXT_PUBLIC_FEATURE_MOBILE_APP, true),
      pwa: parseBoolean(env.NEXT_PUBLIC_FEATURE_PWA, true),
      aiInsights: parseBoolean(env.NEXT_PUBLIC_FEATURE_AI_INSIGHTS, true),
      injuryPrediction: parseBoolean(env.NEXT_PUBLIC_FEATURE_INJURY_PREDICTION, true),
      formationOptimizer: parseBoolean(env.NEXT_PUBLIC_FEATURE_FORMATION_OPTIMIZER, true),
      multiSport: parseBoolean(env.NEXT_PUBLIC_FEATURE_MULTI_SPORT, true),
    },
    
    // Pricing Tiers
    pricing: {
      free: {
        name: 'Free',
        price: 0,
        description: 'Perfect for individual players getting started',
        features: [
          'Personal player profile',
          'Basic statistics tracking',
          'Team chat & messaging',
          'View fixtures and schedules',
          'Join up to 2 teams',
          'Community access',
        ],
        highlighted: false,
        maxTeams: 2,
        maxPlayers: 1,
        maxStorage: '500MB',
        apiAccess: false,
      },
      standard: {
        name: 'Standard',
        price: 4.99,
        period: 'monthly',
        description: 'Ideal for serious players and small teams',
        features: [
          'Everything in Free',
          'Advanced player analytics',
          'Performance tracking',
          'Video upload (5GB storage)',
          'Training session planning',
          'Custom team branding',
          'Join unlimited teams',
          'Export statistics',
        ],
        stripePriceId: env.STRIPE_PRICE_ID_STANDARD,
        stripeProductId: env.STRIPE_PRODUCT_ID_STANDARD,
        highlighted: false,
        maxTeams: -1,
        maxPlayers: 1,
        maxStorage: '5GB',
        apiAccess: false,
      },
      professional: {
        name: 'Professional',
        price: 9.99,
        period: 'monthly',
        description: 'Built for coaches, clubs and leagues',
        features: [
          'Everything in Standard',
          'Tactical board editor',
          'Formation optimizer',
          'Scouting database access',
          'Financial management',
          'League management',
          'Injury tracking',
          'Video storage (50GB)',
          'API access (basic)',
          'Priority support',
        ],
        stripePriceId: env.STRIPE_PRICE_ID_PROFESSIONAL,
        stripeProductId: env.STRIPE_PRODUCT_ID_PROFESSIONAL,
        highlighted: true,
        maxTeams: -1,
        maxPlayers: 50,
        maxStorage: '50GB',
        apiAccess: true,
      },
      elite: {
        name: 'Elite',
        price: 19.99,
        period: 'monthly',
        description: 'Premium features for professional organizations',
        features: [
          'Everything in Professional',
          'AI-powered performance insights',
          'Advanced tactical analysis',
          'Injury prediction & prevention',
          'Set piece analyzer',
          'Multi-sport support',
          'Custom integrations',
          'White-label options',
          'Dedicated account manager',
          '24/7 priority support',
          'Video storage (500GB)',
          'API access (advanced)',
          'Bulk player management',
        ],
        stripePriceId: env.STRIPE_PRICE_ID_ELITE,
        stripeProductId: env.STRIPE_PRODUCT_ID_ELITE,
        highlighted: false,
        maxTeams: -1,
        maxPlayers: -1,
        maxStorage: '500GB',
        apiAccess: true,
      },
    },
    
    // Navigation Links
    navLinks: [
      { title: 'Features', href: '/features' },
      { title: 'Sports', href: '/sports', badge: '12' },
      { title: 'Pricing', href: '/pricing' },
      { title: 'Docs', href: '/docs', external: true },
      { title: 'Support', href: '/support' },
    ],
    
    // Footer Links
    footerLinks: {
      product: [
        { title: 'Features', href: '/features' },
        { title: 'All Sports', href: '/sports' },
        { title: 'Pricing', href: '/pricing' },
        { title: 'Security', href: '/security' },
        { title: 'Roadmap', href: '/roadmap' },
        { title: 'Status', href: 'https://status.pitchconnect.com', external: true },
      ],
      company: [
        { title: 'About Us', href: '/about' },
        { title: 'Blog', href: '/blog' },
        { title: 'Careers', href: '/careers' },
        { title: 'Press', href: '/press' },
        { title: 'Contact', href: '/contact' },
      ],
      legal: [
        { title: 'Privacy Policy', href: '/privacy' },
        { title: 'Terms of Service', href: '/terms' },
        { title: 'Cookie Policy', href: '/cookies' },
        { title: 'GDPR', href: '/gdpr' },
        { title: 'Accessibility', href: '/accessibility' },
      ],
      social: [
        { title: 'Twitter', href: 'https://twitter.com/pitchconnect', external: true, icon: 'Twitter' },
        { title: 'Instagram', href: 'https://instagram.com/pitchconnect', external: true, icon: 'Instagram' },
        { title: 'LinkedIn', href: 'https://linkedin.com/company/pitchconnect', external: true, icon: 'Linkedin' },
        { title: 'YouTube', href: 'https://youtube.com/@pitchconnect', external: true, icon: 'Youtube' },
        { title: 'Discord', href: 'https://discord.gg/pitchconnect', external: true, icon: 'MessageCircle' },
      ],
    },
    
    // Support
    support: {
      email: env.SUPPORT_EMAIL,
      url: 'https://support.pitchconnect.com',
      documentation: 'https://docs.pitchconnect.com',
      status: 'https://status.pitchconnect.com',
    },
    
    // Limits
    limits: {
      maxFileUploadSize: 100 * 1024 * 1024, // 100MB
      maxVideoLength: 3600, // 1 hour
      maxTeamMembers: 100,
      maxMatchesPerDay: 10,
      rateLimit: 100, // requests per minute
    },
  };
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const siteConfig = createSiteConfig();

// =============================================================================
// HELPER EXPORTS
// =============================================================================

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return siteConfig.features[feature] === true;
}

/**
 * Get sport configuration
 */
export function getSportConfig(sport: Sport): SportConfig {
  const config = siteConfig.sports[sport];
  if (!config) {
    throw new Error(`Invalid sport: ${sport}`);
  }
  return config;
}

/**
 * Get all supported sports
 */
export function getAllSports(): Sport[] {
  return Object.keys(siteConfig.sports) as Sport[];
}

/**
 * Get sport by name (case-insensitive)
 */
export function getSportByName(name: string): Sport | undefined {
  const normalized = name.toUpperCase().replace(/\s+/g, '_');
  return getAllSports().find(s => s === normalized || siteConfig.sports[s].name.toUpperCase() === name.toUpperCase());
}

/**
 * Get pricing tier
 */
export function getPricingTier(tier: keyof typeof siteConfig.pricing): PricingTier {
  return siteConfig.pricing[tier];
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(siteConfig.regional.locale, {
    style: 'currency',
    currency: siteConfig.regional.currency,
  }).format(amount);
}

/**
 * Format date according to regional settings
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(siteConfig.regional.locale, {
    dateStyle: 'medium',
    timeZone: siteConfig.regional.timezone,
  }).format(d);
}

/**
 * Format time according to regional settings
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(siteConfig.regional.locale, {
    timeStyle: 'short',
    timeZone: siteConfig.regional.timezone,
  }).format(d);
}

/**
 * Check if in production
 */
export function isProduction(): boolean {
  return siteConfig.environment === 'production';
}

/**
 * Check if in development
 */
export function isDevelopment(): boolean {
  return siteConfig.environment === 'development';
}

/**
 * Get API URL with optional path
 */
export function getApiUrl(path?: string): string {
  const base = siteConfig.api.url;
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
}

/**
 * Validate sport enum value
 */
export function isValidSport(value: unknown): value is Sport {
  return SportEnum.safeParse(value).success;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { SiteConfig, SportConfig, PricingTier, NavigationLink, FeatureFlags, RegionalSettings };