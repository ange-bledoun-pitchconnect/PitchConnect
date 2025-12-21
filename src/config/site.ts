/**
 * Enhanced Site Configuration
 * Global constants and metadata for PitchConnect application
 * Type-safe configuration with runtime validation
 * 
 * This file is sourced from environment variables and provides
 * a strongly-typed interface to all application configuration
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SiteConfigData {
  // Basic Info
  name: string;
  description: string;
  url: string;
  ogImage: string;
  twitter: string;

  // App Version & Build
  version: string;
  buildId: string;
  buildTimestamp: string;
  environment: 'development' | 'staging' | 'production';

  // API Configuration
  apiUrl: string;
  apiTimeout: number;
  apiVersion: string;

  // Sport Settings
  football: {
    matchDuration: number;
    halftimeDuration: number;
    pointsWin: number;
    pointsDraw: number;
    pointsLoss: number;
    maxSquadSize: number;
    maxSubstitutions: number;
    seasonStartMonth: number;
    seasonEndMonth: number;
  };

  // Regional Settings
  regional: {
    locale: string;
    timezone: string;
    currency: string;
    currencySymbol: string;
    dateFormat: string;
    timeFormat: string;
    country: string;
  };

  // Feature Flags
  features: {
    liveScoring: boolean;
    payments: boolean;
    notifications: boolean;
    analytics: boolean;
    videoAnalysis: boolean;
    tacticalBoard: boolean;
    scouting: boolean;
    trainingPlanner: boolean;
    gamification: boolean;
    websocketUpdates: boolean;
    realTimeSync: boolean;
    teamChat: boolean;
    mobileApp: boolean;
    pwa: boolean;
  };

  // Pricing Tiers
  pricing: {
    free: PricingTier;
    standard: PricingTier;
    professional: PricingTier;
    elite: PricingTier;
  };

  // Navigation
  navLinks: NavigationLink[];
  footerLinks: {
    product: NavigationLink[];
    company: NavigationLink[];
    legal: NavigationLink[];
  };

  // Support & Contact
  support: {
    email: string;
    url: string;
    documentation: string;
  };
}

export interface PricingTier {
  name: string;
  price: number;
  period?: 'monthly' | 'yearly';
  description: string;
  features: string[];
  stripePriceId?: string;
  stripeProductId?: string;
  highlighted?: boolean;
}

export interface NavigationLink {
  title: string;
  href: string;
  external?: boolean;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const EnvVariablesSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('PitchConnect'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('3.0.0'),
  NEXT_PUBLIC_APP_TAGLINE: z.string().optional(),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default('Multi-sport team management platform'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),
  NEXT_PUBLIC_API_TIMEOUT: z.string().default('30000'),
  NEXT_PUBLIC_APP_BUILD_ID: z.string().optional(),
  NEXT_PUBLIC_BUILD_TIMESTAMP: z.string().optional(),
  
  API_VERSION: z.string().default('3.0.0'),
  API_BUILD_DATE: z.string().optional(),

  // Sport Settings
  NEXT_PUBLIC_DEFAULT_MATCH_DURATION: z.string().default('90'),
  NEXT_PUBLIC_DEFAULT_HALF_TIME: z.string().default('15'),
  NEXT_PUBLIC_POINTS_WIN: z.string().default('3'),
  NEXT_PUBLIC_POINTS_DRAW: z.string().default('1'),
  NEXT_PUBLIC_POINTS_LOSS: z.string().default('0'),
  NEXT_PUBLIC_SEASON_START_MONTH: z.string().default('8'),
  NEXT_PUBLIC_SEASON_END_MONTH: z.string().default('5'),
  NEXT_PUBLIC_MAX_SQUAD_SIZE: z.string().default('25'),
  NEXT_PUBLIC_MAX_SUBSTITUTIONS: z.string().default('5'),

  // Regional Settings
  NEXT_PUBLIC_LOCALE: z.string().default('en-GB'),
  NEXT_PUBLIC_TIMEZONE: z.string().default('Europe/London'),
  NEXT_PUBLIC_COUNTRY: z.string().default('GB'),
  NEXT_PUBLIC_CURRENCY: z.string().default('GBP'),
  NEXT_PUBLIC_CURRENCY_SYMBOL: z.string().default('£'),
  NEXT_PUBLIC_DATE_FORMAT: z.string().default('DD/MM/YYYY'),
  NEXT_PUBLIC_TIME_FORMAT: z.string().default('HH:mm'),

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

  // Support
  SUPPORT_EMAIL: z.string().email().optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert string boolean to actual boolean
 */
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer from environment variable
 */
function parseInt(value: string | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ============================================================================
// Site Configuration Factory
// ============================================================================

/**
 * Create validated site configuration from environment variables
 */
export function createSiteConfig(): SiteConfigData {
  // Validate environment variables
  const env = EnvVariablesSchema.parse(process.env);

  return {
    // Basic Info
    name: env.NEXT_PUBLIC_APP_NAME,
    description: env.NEXT_PUBLIC_APP_DESCRIPTION,
    url: env.NEXT_PUBLIC_APP_URL,
    ogImage: 'https://pitchconnect.com/og-image.png',
    twitter: '@pitchconnect',

    // App Version & Build
    version: env.NEXT_PUBLIC_APP_VERSION,
    buildId: env.NEXT_PUBLIC_APP_BUILD_ID || `build-${Date.now()}`,
    buildTimestamp: env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString(),
    environment: env.NEXT_PUBLIC_APP_ENV,

    // API Configuration
    apiUrl: env.NEXT_PUBLIC_API_URL,
    apiTimeout: parseInt(env.NEXT_PUBLIC_API_TIMEOUT),
    apiVersion: env.API_VERSION,

    // Sport Settings (Football)
    football: {
      matchDuration: parseInt(env.NEXT_PUBLIC_DEFAULT_MATCH_DURATION),
      halftimeDuration: parseInt(env.NEXT_PUBLIC_DEFAULT_HALF_TIME),
      pointsWin: parseInt(env.NEXT_PUBLIC_POINTS_WIN),
      pointsDraw: parseInt(env.NEXT_PUBLIC_POINTS_DRAW),
      pointsLoss: parseInt(env.NEXT_PUBLIC_POINTS_LOSS),
      maxSquadSize: parseInt(env.NEXT_PUBLIC_MAX_SQUAD_SIZE),
      maxSubstitutions: parseInt(env.NEXT_PUBLIC_MAX_SUBSTITUTIONS),
      seasonStartMonth: parseInt(env.NEXT_PUBLIC_SEASON_START_MONTH),
      seasonEndMonth: parseInt(env.NEXT_PUBLIC_SEASON_END_MONTH),
    },

    // Regional Settings
    regional: {
      locale: env.NEXT_PUBLIC_LOCALE,
      timezone: env.NEXT_PUBLIC_TIMEZONE,
      currency: env.NEXT_PUBLIC_CURRENCY,
      currencySymbol: env.NEXT_PUBLIC_CURRENCY_SYMBOL,
      dateFormat: env.NEXT_PUBLIC_DATE_FORMAT,
      timeFormat: env.NEXT_PUBLIC_TIME_FORMAT,
      country: env.NEXT_PUBLIC_COUNTRY,
    },

    // Feature Flags
    features: {
      liveScoring: parseBoolean(env.NEXT_PUBLIC_FEATURE_LIVE_SCORING),
      payments: parseBoolean(env.NEXT_PUBLIC_FEATURE_PAYMENTS),
      notifications: parseBoolean(env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS),
      analytics: parseBoolean(env.NEXT_PUBLIC_FEATURE_ANALYTICS),
      videoAnalysis: parseBoolean(env.NEXT_PUBLIC_FEATURE_VIDEO_ANALYSIS),
      tacticalBoard: parseBoolean(env.NEXT_PUBLIC_FEATURE_TACTICAL_BOARD),
      scouting: parseBoolean(env.NEXT_PUBLIC_FEATURE_SCOUTING),
      trainingPlanner: parseBoolean(env.NEXT_PUBLIC_FEATURE_TRAINING_PLANNER),
      gamification: parseBoolean(env.NEXT_PUBLIC_FEATURE_GAMIFICATION),
      websocketUpdates: parseBoolean(env.NEXT_PUBLIC_FEATURE_WEBSOCKET_UPDATES),
      realTimeSync: parseBoolean(env.NEXT_PUBLIC_FEATURE_REAL_TIME_SYNC),
      teamChat: parseBoolean(env.NEXT_PUBLIC_FEATURE_TEAM_CHAT),
      mobileApp: parseBoolean(env.NEXT_PUBLIC_FEATURE_MOBILE_APP),
      pwa: parseBoolean(env.NEXT_PUBLIC_FEATURE_PWA),
    },

    // Pricing Tiers
    pricing: {
      free: {
        name: 'Free',
        price: 0,
        description: 'Perfect for individual players to get started',
        features: [
          'Player profile with stats',
          'Basic statistics tracking',
          'Team chat & messaging',
          'View fixtures and schedules',
          'Community access',
        ],
        highlighted: false,
      },
      standard: {
        name: 'Standard',
        price: 3.99,
        period: 'monthly',
        description: 'Ideal for coaches and small teams',
        features: [
          'Everything in Free',
          'Advanced player analytics',
          'Tactical board editor',
          'Video upload & storage (5GB)',
          'Training session planning',
          'Performance reports',
        ],
        stripePriceId: process.env.STRIPE_PRICE_ID_PLAYER_PRO,
        stripeProductId: process.env.STRIPE_PRODUCT_ID_PLAYER_PRO,
        highlighted: false,
      },
      professional: {
        name: 'Professional',
        price: 7.99,
        period: 'monthly',
        description: 'Built for clubs and leagues',
        features: [
          'Everything in Standard',
          'Scouting database access',
          'Financial management tools',
          'League management features',
          'API access (basic)',
          'Advanced scheduling',
          'Injury tracking',
          'Video storage (50GB)',
        ],
        stripePriceId: process.env.STRIPE_PRICE_ID_COACH,
        stripeProductId: process.env.STRIPE_PRODUCT_ID_COACH,
        highlighted: true,
      },
      elite: {
        name: 'Elite',
        price: 14.99,
        period: 'monthly',
        description: 'Premium features for professional organizations',
        features: [
          'Everything in Professional',
          'AI-powered performance insights',
          'Advanced tactical analysis',
          'Injury prediction & prevention',
          'Formation optimizer',
          'Set piece analyzer',
          'Custom integrations',
          'Priority 24/7 support',
          'Video storage (500GB)',
          'API access (advanced)',
        ],
        stripePriceId: process.env.STRIPE_PRICE_ID_MANAGER,
        stripeProductId: process.env.STRIPE_PRODUCT_ID_MANAGER,
        highlighted: false,
      },
    },

    // Navigation Links
    navLinks: [
      {
        title: 'Features',
        href: '/features',
      },
      {
        title: 'Pricing',
        href: '/pricing',
      },
      {
        title: 'Documentation',
        href: '/docs',
        external: true,
      },
      {
        title: 'Support',
        href: '/support',
      },
    ],

    // Footer Links
    footerLinks: {
      product: [
        { title: 'Features', href: '/features' },
        { title: 'Pricing', href: '/pricing' },
        { title: 'Security', href: '/security' },
        { title: 'Status', href: 'https://status.pitchconnect.com', external: true },
      ],
      company: [
        { title: 'About', href: '/about' },
        { title: 'Blog', href: '/blog' },
        { title: 'Careers', href: '/careers' },
        { title: 'Contact', href: '/contact' },
      ],
      legal: [
        { title: 'Privacy Policy', href: '/privacy' },
        { title: 'Terms of Service', href: '/terms' },
        { title: 'Cookie Policy', href: '/cookies' },
        { title: 'GDPR Compliance', href: '/gdpr' },
      ],
    },

    // Support
    support: {
      email: env.SUPPORT_EMAIL || 'support@pitchconnect.com',
      url: 'https://support.pitchconnect.com',
      documentation: 'https://docs.pitchconnect.com',
    },
  };
}

// ============================================================================
// Exported Configuration Singleton
// ============================================================================

export const siteConfig = createSiteConfig();

export type SiteConfig = typeof siteConfig;

// ============================================================================
// Configuration Validators & Helpers
// ============================================================================

/**
 * Validate that a required feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof SiteConfigData['features']
): boolean {
  return siteConfig.features[feature] === true;
}

/**
 * Get pricing tier by name
 */
export function getPricingTier(
  tier: keyof SiteConfigData['pricing']
): PricingTier {
  return siteConfig.pricing[tier];
}

/**
 * Get formatted currency amount
 */
export function formatCurrency(amount: number): string {
  return `${siteConfig.regional.currencySymbol}${amount.toFixed(2)}`;
}

/**
 * Get pricing tier URL slug
 */
export function getPricingTierSlug(tier: keyof SiteConfigData['pricing']): string {
  return tier.toLowerCase();
}

/**
 * Check if in production environment
 */
export function isProduction(): boolean {
  return siteConfig.environment === 'production';
}

/**
 * Check if in development environment
 */
export function isDevelopment(): boolean {
  return siteConfig.environment === 'development';
}

/**
 * Get API base URL (with fallback)
 */
export function getApiUrl(path?: string): string {
  const baseUrl = siteConfig.apiUrl;
  return path ? `${baseUrl}${path.startsWith('/') ? path : `/${path}`}` : baseUrl;
}
