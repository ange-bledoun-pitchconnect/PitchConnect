/**
 * Site Configuration
 * Global constants and metadata for the application
 */

export const siteConfig = {
  // Basic Info
  name: 'PitchConnect',
  description:
    'The world\'s best football management platform - Real-world Football Manager',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: 'https://pitchconnect.com/og-image.png',
  twitter: '@pitchconnect',

  // App Version
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Pricing Tiers
  pricing: {
    free: {
      name: 'Free',
      price: 0,
      description: 'For individual players',
      features: [
        'Player profile',
        'Basic stats tracking',
        'Team chat',
        'View fixtures',
      ],
    },
    standard: {
      name: 'Standard',
      price: 3.99,
      description: 'For coaches & small teams',
      features: [
        'Everything in Free',
        'Advanced analytics',
        'Tactical board',
        'Video uploads',
        'Training sessions',
      ],
    },
    professional: {
      name: 'Professional',
      price: 7.99,
      description: 'For clubs & leagues',
      features: [
        'Everything in Standard',
        'Scouting database',
        'Financial management',
        'League management',
        'API access',
      ],
    },
    elite: {
      name: 'Elite',
      price: 14.99,
      description: 'Premium features & support',
      features: [
        'Everything in Professional',
        'AI-powered insights',
        'Advanced analytics',
        'Premium support',
        'Custom integrations',
      ],
    },
  },

  // Sport Settings
  football: {
    matchDuration: parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_MATCH_DURATION || '90'
    ),
    halftimeDuration: parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_HALF_TIME || '15'
    ),
    pointsWin: parseInt(process.env.NEXT_PUBLIC_POINTS_WIN || '3'),
    pointsDraw: parseInt(process.env.NEXT_PUBLIC_POINTS_DRAW || '1'),
    pointsLoss: parseInt(process.env.NEXT_PUBLIC_POINTS_LOSS || '0'),
    maxSquadSize: 25,
    maxSubstitutions: 5,
    seasonStartMonth: parseInt(
      process.env.NEXT_PUBLIC_SEASON_START_MONTH || '8'
    ),
    seasonEndMonth: parseInt(process.env.NEXT_PUBLIC_SEASON_END_MONTH || '5'),
  },

  // Regional Settings
  regional: {
    locale: process.env.NEXT_PUBLIC_LOCALE || 'en-GB',
    timezone: process.env.NEXT_PUBLIC_TIMEZONE || 'Europe/London',
    currency: process.env.NEXT_PUBLIC_CURRENCY || 'GBP',
    currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '£',
    dateFormat: process.env.NEXT_PUBLIC_DATE_FORMAT || 'DD/MM/YYYY',
    timeFormat: process.env.NEXT_PUBLIC_TIME_FORMAT || 'HH:mm',
  },

  // Feature Flags
  features: {
    liveScoring: process.env.NEXT_PUBLIC_FEATURE_LIVE_SCORING === 'true',
    payments: process.env.NEXT_PUBLIC_FEATURE_PAYMENTS === 'true',
    notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS === 'true',
    analytics: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true',
    videoAnalysis: process.env.NEXT_PUBLIC_FEATURE_VIDEO_ANALYSIS === 'true',
    tacticalBoard: process.env.NEXT_PUBLIC_FEATURE_TACTICAL_BOARD === 'true',
    scouting: process.env.NEXT_PUBLIC_FEATURE_SCOUTING === 'true',
    trainingPlanner: process.env.NEXT_PUBLIC_FEATURE_TRAINING_PLANNER === 'true',
    gamification: process.env.NEXT_PUBLIC_FEATURE_GAMIFICATION === 'true',
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
      { title: 'Status', href: '/status' },
    ],
    company: [
      { title: 'About', href: '/about' },
      { title: 'Blog', href: '/blog' },
      { title: 'Careers', href: '/careers' },
      { title: 'Contact', href: '/contact' },
    ],
    legal: [
      { title: 'Privacy', href: '/privacy' },
      { title: 'Terms', href: '/terms' },
      { title: 'Cookie Policy', href: '/cookies' },
      { title: 'GDPR', href: '/gdpr' },
    ],
  },
};

export type SiteConfig = typeof siteConfig;
